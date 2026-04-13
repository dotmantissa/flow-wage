// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library Errors {
    // Access
    error NotEmployer(address caller, address expected);
    error NotEmployee(address caller, address expected);
    error AccessDenied(address caller, bytes32 role);
    error Unauthorised(address caller);

    // Registry
    error EmployerNotRegistered(address employer);
    error KYCNotApproved(address account);

    // Stream state
    error StreamCancelled(uint256 streamId);
    error StreamEnded(uint256 streamId);
    error StreamAlreadyActive(uint256 streamId);
    error StreamNotFound(uint256 streamId);
    error StreamPaused(uint256 streamId);
    error StreamNotPaused(uint256 streamId);

    // Values
    error InsufficientDeposit(uint256 provided, uint256 minimum);
    error ZeroStreamRate();
    error InsufficientClaimable(uint256 requested, uint256 available);
    error InvalidDuration(uint256 provided, uint256 minimum);
    error InvalidStartTime(uint256 provided, uint256 minimum);
    error InvalidEndTime(uint256 start, uint256 end);
    error ZeroAddress();
    error TokenNotWhitelisted(address token);
    error VaultDepositCapExceeded(uint256 current, uint256 cap);
    error ZeroTopUp();

    // Gateway
    error HSPGatewayCallFailed(bytes returnData);
    error SlippageExceeded(uint256 received, uint256 minExpected);
    error WithdrawalCooldownActive(address employee, uint256 unlockTime);
    error DailyWithdrawalLimitReached(address employee, uint256 limit);

    // Factory
    error VaultAlreadyExists(address employer, address vault);
    error VaultDoesNotExist(address employer);

    // Protocol
    error ProtocolPaused();
    error ProtocolNotPaused();
}
