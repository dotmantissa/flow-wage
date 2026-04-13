// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {FlowWageAccessControl} from "./security/FlowWageAccessControl.sol";
import {IWithdrawalGateway, IStreamVault, IHSPGateway} from "./interfaces/IFlowWage.sol";
import {Errors} from "./libraries/Errors.sol";

contract WithdrawalGateway is FlowWageAccessControl, ReentrancyGuard, IWithdrawalGateway {
    using SafeERC20 for IERC20;

    uint256 public constant DEFAULT_DAILY_LIMIT = 50_000 * 1e6;
    uint256 public constant MAX_DAILY_LIMIT = 500_000 * 1e6;
    uint256 public constant DEFAULT_COOLDOWN = 30;

    bool public override hspEnabled = true;
    address public override hspGateway;
    uint256 public override cooldownSeconds = DEFAULT_COOLDOWN;

    mapping(address => uint256) private _dailyLimit;
    mapping(address => mapping(uint256 => uint256)) private _dailyUsed;
    mapping(address => uint256) private _cooldownUnlock;

    constructor(address initialAdmin, address gateway) FlowWageAccessControl(initialAdmin) {
        if (gateway == address(0)) revert Errors.ZeroAddress();
        hspGateway = gateway;
    }

    function withdraw(WithdrawalRequest calldata request) external nonReentrant {
        if (request.vault == address(0) || request.token == address(0)) revert Errors.ZeroAddress();

        IStreamVault.Stream memory stream = IStreamVault(request.vault).getStream(request.streamId);
        if (stream.employee != msg.sender) revert Errors.NotEmployee(msg.sender, stream.employee);

        uint256 unlock = _cooldownUnlock[msg.sender];
        if (block.timestamp < unlock) revert Errors.WithdrawalCooldownActive(msg.sender, unlock);

        uint256 dayIndex = block.timestamp / 1 days;
        uint256 limit = _dailyLimit[msg.sender];
        if (limit == 0) limit = DEFAULT_DAILY_LIMIT;
        uint256 usedToday = _dailyUsed[msg.sender][dayIndex];

        uint256 amount = request.amount;
        if (amount == 0) {
            amount = IStreamVault(request.vault).claimableBalance(request.streamId);
        }
        if (usedToday + amount > limit) revert Errors.DailyWithdrawalLimitReached(msg.sender, limit);

        IStreamVault(request.vault).withdraw(request.streamId, amount, address(this));
        _dailyUsed[msg.sender][dayIndex] = usedToday + amount;
        _cooldownUnlock[msg.sender] = block.timestamp + cooldownSeconds;

        bytes32 transferId;
        if (request.useHSP && hspEnabled) {
            IERC20(request.token).forceApprove(hspGateway, amount);
            try IHSPGateway(hspGateway).initiateTransfer(
                request.token,
                amount,
                request.destinationRef,
                request.beneficiary == address(0) ? msg.sender : request.beneficiary
            ) returns (bytes32 id) {
                transferId = id;
                (uint8 status, uint256 settledAmount) = IHSPGateway(hspGateway).getTransferStatus(id);
                if (status != 1) revert Errors.HSPGatewayCallFailed(abi.encode(status));
                if (settledAmount < request.minExpected) {
                    revert Errors.SlippageExceeded(settledAmount, request.minExpected);
                }
            } catch (bytes memory reason) {
                IERC20(request.token).forceApprove(hspGateway, 0);
                revert Errors.HSPGatewayCallFailed(reason);
            }
        } else {
            IERC20(request.token).safeTransfer(msg.sender, amount);
        }

        emit WithdrawalProcessed(
            msg.sender,
            request.vault,
            request.streamId,
            request.token,
            amount,
            request.useHSP && hspEnabled,
            transferId
        );
    }

    function toggleHSP(bool enabled) external onlyRole(PROTOCOL_ADMIN_ROLE) {
        hspEnabled = enabled;
        emit HSPToggled(enabled, msg.sender);
    }

    function setHSPGateway(address gateway) external onlyRole(PROTOCOL_ADMIN_ROLE) {
        if (gateway == address(0)) revert Errors.ZeroAddress();
        hspGateway = gateway;
        emit HSPGatewayUpdated(gateway, msg.sender);
    }

    function setCooldown(uint256 cooldown) external onlyRole(PROTOCOL_ADMIN_ROLE) {
        cooldownSeconds = cooldown;
        emit CooldownUpdated(cooldown, msg.sender);
    }

    function setDailyLimit(address employee, uint256 limit) external onlyRole(PROTOCOL_ADMIN_ROLE) {
        if (employee == address(0)) revert Errors.ZeroAddress();
        if (limit > MAX_DAILY_LIMIT) revert Errors.InvalidDuration(limit, MAX_DAILY_LIMIT);
        _dailyLimit[employee] = limit;
        emit DailyLimitUpdated(employee, limit, msg.sender);
    }

    function dailyLimit(address employee) external view returns (uint256) {
        uint256 limit = _dailyLimit[employee];
        return limit == 0 ? DEFAULT_DAILY_LIMIT : limit;
    }

    function dailyUsed(address employee, uint256 dayIndex) external view returns (uint256) {
        return _dailyUsed[employee][dayIndex];
    }

    function cooldownUnlock(address employee) external view returns (uint256) {
        return _cooldownUnlock[employee];
    }

    receive() external payable {
        revert("NO_ETH");
    }
}
