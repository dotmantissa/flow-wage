// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IStreamVault, IPayrollRegistry} from "./interfaces/IFlowWage.sol";
import {Errors} from "./libraries/Errors.sol";
import {StreamMath} from "./libraries/StreamMath.sol";

contract StreamVault is IStreamVault, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    uint256 public constant SCALE_FACTOR = 1e18;
    uint256 public constant VAULT_DEPOSIT_CAP = 10_000_000 * 1e6;
    uint256 public constant MAX_ACTIVE_STREAMS = 500;

    address public immutable override employer;
    address public immutable override factory;
    IPayrollRegistry public immutable registry;

    uint256 private _nextStreamId = 1;
    uint256 private _activeStreamCount;

    mapping(uint256 => Stream) private _streams;
    mapping(address => uint256[]) private _employeeStreams;
    mapping(address => uint256) private _activeDepositsByToken;
    mapping(uint256 => uint256) private _pausedAt;
    mapping(uint256 => uint256) private _pausedDuration;
    mapping(uint256 => mapping(address => uint256)) private _pendingCancellationClaims;

    modifier onlyEmployer() {
        if (msg.sender != employer) revert Errors.NotEmployer(msg.sender, employer);
        _;
    }

    modifier onlyFactory() {
        if (msg.sender != factory) revert Errors.Unauthorised(msg.sender);
        _;
    }

    constructor(address _employer, address _registry, address _factory) {
        if (_employer == address(0) || _registry == address(0) || _factory == address(0)) revert Errors.ZeroAddress();
        employer = _employer;
        registry = IPayrollRegistry(_registry);
        factory = _factory;
    }

    function createStream(StreamParams calldata params) external onlyEmployer whenNotPaused returns (uint256 streamId) {
        if (_activeStreamCount >= MAX_ACTIVE_STREAMS) revert Errors.InvalidDuration(_activeStreamCount, MAX_ACTIVE_STREAMS);
        if (!registry.isEmployerActive(employer)) revert Errors.EmployerNotRegistered(employer);
        if (!registry.isKYCApproved(params.employee)) revert Errors.KYCNotApproved(params.employee);
        if (!registry.isTokenWhitelisted(params.token)) revert Errors.TokenNotWhitelisted(params.token);
        if (!StreamMath.validateStreamParams(params.totalDeposit, params.startTime, params.endTime, block.timestamp)) {
            revert Errors.InvalidDuration(params.endTime - params.startTime, 1 days);
        }

        uint256 tokenCurrent = _activeDepositsByToken[params.token] + params.totalDeposit;
        if (tokenCurrent > VAULT_DEPOSIT_CAP) revert Errors.VaultDepositCapExceeded(tokenCurrent, VAULT_DEPOSIT_CAP);

        uint256 duration = params.endTime - params.startTime;
        uint256 scaledRate = StreamMath.computeScaledRate(params.totalDeposit, duration);
        if (scaledRate == 0) revert Errors.ZeroStreamRate();

        streamId = _nextStreamId++;
        _streams[streamId] = Stream({
            id: streamId,
            employer: employer,
            employee: params.employee,
            token: params.token,
            totalDeposit: params.totalDeposit,
            withdrawn: 0,
            scaledRate: scaledRate,
            startTime: params.startTime,
            endTime: params.endTime,
            status: StreamStatus.Active
        });

        _employeeStreams[params.employee].push(streamId);
        _activeStreamCount += 1;
        _activeDepositsByToken[params.token] = tokenCurrent;

        IERC20(params.token).safeTransferFrom(msg.sender, address(this), params.totalDeposit);

        emit StreamCreated(
            streamId,
            employer,
            params.employee,
            params.token,
            params.totalDeposit,
            scaledRate,
            params.startTime,
            params.endTime
        );
    }

    function topUpStream(uint256 streamId, uint256 additionalAmount) external onlyEmployer whenNotPaused {
        if (additionalAmount == 0) revert Errors.ZeroTopUp();
        Stream storage stream = _requireStream(streamId);
        if (stream.status != StreamStatus.Active) revert Errors.StreamPaused(streamId);

        uint256 extension = (additionalAmount * SCALE_FACTOR) / stream.scaledRate;
        if (extension == 0) revert Errors.ZeroTopUp();

        uint256 oldEndTime = stream.endTime;
        stream.totalDeposit += additionalAmount;
        stream.endTime += extension;
        _activeDepositsByToken[stream.token] += additionalAmount;
        if (_activeDepositsByToken[stream.token] > VAULT_DEPOSIT_CAP) {
            revert Errors.VaultDepositCapExceeded(_activeDepositsByToken[stream.token], VAULT_DEPOSIT_CAP);
        }

        IERC20(stream.token).safeTransferFrom(msg.sender, address(this), additionalAmount);
        emit StreamTopUp(streamId, additionalAmount, oldEndTime, stream.endTime);
    }

    function withdraw(uint256 streamId, uint256 amount, address to) external nonReentrant whenNotPaused {
        Stream storage stream = _requireStream(streamId);
        _settleEndedStream(streamId, stream);
        if (msg.sender != stream.employee) revert Errors.NotEmployee(msg.sender, stream.employee);
        if (to == address(0)) revert Errors.ZeroAddress();

        uint256 claimable = _claimable(stream);
        if (amount > claimable) revert Errors.InsufficientClaimable(amount, claimable);

        stream.withdrawn += amount;
        _activeDepositsByToken[stream.token] -= amount;
        IERC20(stream.token).safeTransfer(to, amount);

        emit StreamWithdrawn(streamId, stream.employee, to, amount);
    }

    function withdrawAll(uint256 streamId, address to) external nonReentrant whenNotPaused returns (uint256 amount) {
        Stream storage stream = _requireStream(streamId);
        _settleEndedStream(streamId, stream);
        if (msg.sender != stream.employee) revert Errors.NotEmployee(msg.sender, stream.employee);
        if (to == address(0)) revert Errors.ZeroAddress();

        amount = _claimable(stream);
        if (amount == 0) revert Errors.InsufficientClaimable(0, 0);

        stream.withdrawn += amount;
        _activeDepositsByToken[stream.token] -= amount;
        IERC20(stream.token).safeTransfer(to, amount);

        emit StreamWithdrawn(streamId, stream.employee, to, amount);
    }

    function pauseStream(uint256 streamId) external onlyEmployer whenNotPaused {
        Stream storage stream = _requireStream(streamId);
        if (stream.status != StreamStatus.Active) revert Errors.StreamNotPaused(streamId);
        stream.status = StreamStatus.Paused;
        _pausedAt[streamId] = block.timestamp;
        emit StreamPaused(streamId, block.timestamp);
    }

    function resumeStream(uint256 streamId) external onlyEmployer whenNotPaused {
        Stream storage stream = _requireStream(streamId);
        if (stream.status != StreamStatus.Paused) revert Errors.StreamNotPaused(streamId);
        uint256 delta = block.timestamp - _pausedAt[streamId];
        _pausedDuration[streamId] += delta;
        stream.endTime += delta;
        stream.status = StreamStatus.Active;
        _pausedAt[streamId] = 0;
        emit StreamResumed(streamId, block.timestamp, delta, stream.endTime);
    }

    function cancelStream(uint256 streamId) external onlyEmployer nonReentrant whenNotPaused {
        Stream storage stream = _requireStream(streamId);
        if (stream.status == StreamStatus.Cancelled) revert Errors.StreamCancelled(streamId);

        (uint256 employerRefund, uint256 employeeOwed) = StreamMath.computeCancellationSplit(
            stream.scaledRate,
            _effectiveStartTime(streamId, stream.startTime),
            stream.endTime,
            block.timestamp,
            stream.totalDeposit,
            stream.withdrawn
        );

        stream.status = StreamStatus.Cancelled;
        if (_activeStreamCount > 0) _activeStreamCount -= 1;

        if (employeeOwed > 0) {
            stream.withdrawn += employeeOwed;
            _activeDepositsByToken[stream.token] -= employeeOwed;
            _safeTransferWithFallback(streamId, stream.token, stream.employee, employeeOwed);
        }

        if (employerRefund > 0) {
            _activeDepositsByToken[stream.token] -= employerRefund;
            IERC20(stream.token).safeTransfer(employer, employerRefund);
        }

        emit StreamCancelled(streamId, employeeOwed, employerRefund);
    }

    function claimCancellationProceeds(uint256 streamId) external nonReentrant {
        uint256 pending = _pendingCancellationClaims[streamId][msg.sender];
        if (pending == 0) revert Errors.InsufficientClaimable(0, 0);
        _pendingCancellationClaims[streamId][msg.sender] = 0;

        Stream storage stream = _requireStream(streamId);
        IERC20(stream.token).safeTransfer(msg.sender, pending);
        emit CancellationClaimed(streamId, msg.sender, pending);
    }

    function emergencyPause() external onlyFactory {
        _pause();
        emit EmergencyPaused(msg.sender);
    }

    function emergencyUnpause() external onlyFactory {
        _unpause();
        emit EmergencyUnpaused(msg.sender);
    }

    function getStream(uint256 streamId) external view returns (Stream memory) {
        return _streams[streamId];
    }

    function claimableBalance(uint256 streamId) external view returns (uint256) {
        Stream memory stream = _streams[streamId];
        if (stream.id == 0) return 0;
        return _claimable(stream);
    }

    function earnedBalance(uint256 streamId) external view returns (uint256) {
        Stream memory stream = _streams[streamId];
        if (stream.id == 0) return 0;
        return StreamMath.computeEarned(
            stream.scaledRate,
            _effectiveStartTime(streamId, stream.startTime),
            stream.endTime,
            block.timestamp,
            stream.totalDeposit
        );
    }

    function employeeStreams(address employee_) external view returns (uint256[] memory) {
        return _employeeStreams[employee_];
    }

    function nextStreamId() external view returns (uint256) {
        return _nextStreamId;
    }

    function activeStreamCount() external view returns (uint256) {
        return _activeStreamCount;
    }

    function activeDepositsByToken(address token) external view returns (uint256) {
        return _activeDepositsByToken[token];
    }

    function pendingCancellationClaim(uint256 streamId, address employee_) external view returns (uint256) {
        return _pendingCancellationClaims[streamId][employee_];
    }

    function _requireStream(uint256 streamId) internal view returns (Stream storage stream) {
        stream = _streams[streamId];
        if (stream.id == 0) revert Errors.StreamNotFound(streamId);
    }

    function _settleEndedStream(uint256 streamId, Stream storage stream) internal {
        if (stream.status == StreamStatus.Active && block.timestamp >= stream.endTime) {
            stream.status = StreamStatus.Ended;
            if (_activeStreamCount > 0) _activeStreamCount -= 1;
        }
        if (stream.status == StreamStatus.Cancelled) revert Errors.StreamCancelled(streamId);
    }

    function _effectiveStartTime(uint256 streamId, uint256 startTime) internal view returns (uint256) {
        return startTime + _pausedDuration[streamId];
    }

    function _claimable(Stream memory stream) internal view returns (uint256) {
        return StreamMath.computeClaimable(
            stream.scaledRate,
            _effectiveStartTime(stream.id, stream.startTime),
            stream.endTime,
            block.timestamp,
            stream.totalDeposit,
            stream.withdrawn
        );
    }

    function _safeTransferWithFallback(uint256 streamId, address token, address employee_, uint256 amount) internal {
        (bool ok, ) = token.call(abi.encodeWithSelector(IERC20.transfer.selector, employee_, amount));
        if (!ok) {
            _pendingCancellationClaims[streamId][employee_] += amount;
            emit CancellationClaimQueued(streamId, employee_, amount);
        }
    }
}
