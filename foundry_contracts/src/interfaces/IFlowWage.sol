// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPayrollRegistry {
    enum KYCStatus {
        Unverified,
        Pending,
        Approved,
        Revoked
    }

    enum EmployerStatus {
        Unregistered,
        Active,
        Suspended
    }

    event EmployerRegistered(address indexed employer, address indexed admin);
    event EmployerSuspended(address indexed employer, string reason, address indexed admin);
    event EmployerReinstated(address indexed employer, address indexed admin);
    event KYCStatusUpdated(address indexed account, KYCStatus status, address indexed manager);
    event TokenWhitelisted(address indexed token, address indexed admin);
    event TokenDewhitelisted(address indexed token, address indexed admin);

    function registerEmployer(address employer) external;
    function suspendEmployer(address employer, string calldata reason) external;
    function reinstateEmployer(address employer) external;
    function setKYCStatus(address account, KYCStatus status) external;
    function batchSetKYCStatus(address[] calldata accounts, KYCStatus[] calldata statuses) external;
    function whitelistToken(address token) external;
    function dewhitelistToken(address token) external;

    function getEmployerStatus(address employer) external view returns (EmployerStatus);
    function getEmployerSuspendReason(address employer) external view returns (string memory);
    function getKYCStatus(address account) external view returns (KYCStatus);
    function isEmployerActive(address employer) external view returns (bool);
    function isKYCApproved(address account) external view returns (bool);
    function isTokenWhitelisted(address token) external view returns (bool);
}

interface IStreamVault {
    enum StreamStatus {
        Active,
        Paused,
        Cancelled,
        Ended
    }

    struct Stream {
        uint256 id;
        address employer;
        address employee;
        address token;
        uint256 totalDeposit;
        uint256 withdrawn;
        uint256 scaledRate;
        uint256 startTime;
        uint256 endTime;
        StreamStatus status;
    }

    struct StreamParams {
        address employee;
        address token;
        uint256 totalDeposit;
        uint256 startTime;
        uint256 endTime;
    }

    event StreamCreated(
        uint256 indexed streamId,
        address indexed employer,
        address indexed employee,
        address token,
        uint256 totalDeposit,
        uint256 scaledRate,
        uint256 startTime,
        uint256 endTime
    );
    event StreamTopUp(uint256 indexed streamId, uint256 amount, uint256 oldEndTime, uint256 newEndTime);
    event StreamWithdrawn(uint256 indexed streamId, address indexed employee, address indexed to, uint256 amount);
    event StreamPaused(uint256 indexed streamId, uint256 pausedAt);
    event StreamResumed(uint256 indexed streamId, uint256 resumedAt, uint256 pauseDelta, uint256 newEndTime);
    event StreamCancelled(uint256 indexed streamId, uint256 employeePayout, uint256 employerRefund);
    event CancellationClaimQueued(uint256 indexed streamId, address indexed employee, uint256 amount);
    event CancellationClaimed(uint256 indexed streamId, address indexed employee, uint256 amount);
    event EmergencyPaused(address indexed caller);
    event EmergencyUnpaused(address indexed caller);

    function createStream(StreamParams calldata params) external returns (uint256 streamId);
    function topUpStream(uint256 streamId, uint256 additionalAmount) external;
    function withdraw(uint256 streamId, uint256 amount, address to) external;
    function withdrawAll(uint256 streamId, address to) external returns (uint256 amount);
    function pauseStream(uint256 streamId) external;
    function resumeStream(uint256 streamId) external;
    function cancelStream(uint256 streamId) external;
    function claimCancellationProceeds(uint256 streamId) external;

    function getStream(uint256 streamId) external view returns (Stream memory);
    function claimableBalance(uint256 streamId) external view returns (uint256);
    function earnedBalance(uint256 streamId) external view returns (uint256);
    function employeeStreams(address employee) external view returns (uint256[] memory);
    function nextStreamId() external view returns (uint256);
    function activeStreamCount() external view returns (uint256);
    function activeDepositsByToken(address token) external view returns (uint256);
    function pendingCancellationClaim(uint256 streamId, address employee) external view returns (uint256);
    function emergencyPause() external;
    function emergencyUnpause() external;
    function employer() external view returns (address);
    function factory() external view returns (address);
}

interface IFlowWageFactory {
    event VaultDeployed(address indexed employer, address indexed vault, bytes32 indexed salt);
    event FactoryPaused(address indexed caller);
    event FactoryUnpaused(address indexed caller);

    function deployVault() external returns (address vault);
    function getVault(address employer) external view returns (address);
    function hasVault(address employer) external view returns (bool);
    function allVaultsLength() external view returns (uint256);
    function allVaults(uint256 index) external view returns (address);
    function computeVaultAddress(address employer) external view returns (address predicted);
    function emergencyPause(address employer) external;
    function unpauseVault(address employer) external;
    function pauseFactory() external;
    function unpauseFactory() external;
    function factoryPaused() external view returns (bool);
}

interface IWithdrawalGateway {
    struct WithdrawalRequest {
        address vault;
        uint256 streamId;
        uint256 amount;
        address token;
        bool useHSP;
        uint256 minExpected;
        bytes32 destinationRef;
        address beneficiary;
    }

    event WithdrawalProcessed(
        address indexed employee,
        address indexed vault,
        uint256 indexed streamId,
        address token,
        uint256 amount,
        bool viaHSP,
        bytes32 transferId
    );
    event HSPToggled(bool enabled, address indexed admin);
    event HSPGatewayUpdated(address indexed gateway, address indexed admin);
    event CooldownUpdated(uint256 cooldown, address indexed admin);
    event DailyLimitUpdated(address indexed employee, uint256 limit, address indexed admin);

    function withdraw(WithdrawalRequest calldata request) external;
    function toggleHSP(bool enabled) external;
    function setHSPGateway(address gateway) external;
    function setCooldown(uint256 cooldownSeconds) external;
    function setDailyLimit(address employee, uint256 limit) external;
    function hspEnabled() external view returns (bool);
    function hspGateway() external view returns (address);
    function cooldownSeconds() external view returns (uint256);
    function dailyLimit(address employee) external view returns (uint256);
    function dailyUsed(address employee, uint256 dayIndex) external view returns (uint256);
    function cooldownUnlock(address employee) external view returns (uint256);
}

interface IHSPGateway {
    function initiateTransfer(
        address token,
        uint256 amount,
        bytes32 destinationRef,
        address beneficiary
    ) external returns (bytes32 transferId);

    function getTransferStatus(bytes32 transferId) external view returns (uint8 status, uint256 settledAmount);
}
