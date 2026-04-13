// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FlowWageAccessControl} from "./security/FlowWageAccessControl.sol";
import {IPayrollRegistry} from "./interfaces/IFlowWage.sol";
import {Errors} from "./libraries/Errors.sol";

contract PayrollRegistry is FlowWageAccessControl, IPayrollRegistry {
    mapping(address => EmployerStatus) private _employerStatus;
    mapping(address => string) private _suspensionReason;
    mapping(address => KYCStatus) private _kycStatus;
    mapping(address => bool) private _tokenWhitelist;

    constructor(address initialAdmin) FlowWageAccessControl(initialAdmin) {}

    function registerEmployer(address employer) external onlyRole(PROTOCOL_ADMIN_ROLE) {
        if (employer == address(0)) revert Errors.ZeroAddress();
        EmployerStatus status = _employerStatus[employer];
        if (status == EmployerStatus.Active) revert Errors.StreamAlreadyActive(0);
        _employerStatus[employer] = EmployerStatus.Active;
        _suspensionReason[employer] = "";
        emit EmployerRegistered(employer, msg.sender);
    }

    function suspendEmployer(address employer, string calldata reason) external onlyRole(PROTOCOL_ADMIN_ROLE) {
        if (_employerStatus[employer] == EmployerStatus.Unregistered) {
            revert Errors.EmployerNotRegistered(employer);
        }
        _employerStatus[employer] = EmployerStatus.Suspended;
        _suspensionReason[employer] = reason;
        emit EmployerSuspended(employer, reason, msg.sender);
    }

    function reinstateEmployer(address employer) external onlyRole(PROTOCOL_ADMIN_ROLE) {
        if (_employerStatus[employer] == EmployerStatus.Unregistered) {
            revert Errors.EmployerNotRegistered(employer);
        }
        _employerStatus[employer] = EmployerStatus.Active;
        _suspensionReason[employer] = "";
        emit EmployerReinstated(employer, msg.sender);
    }

    function setKYCStatus(address account, KYCStatus status) external onlyRole(KYC_MANAGER_ROLE) {
        if (account == address(0)) revert Errors.ZeroAddress();
        _kycStatus[account] = status;
        emit KYCStatusUpdated(account, status, msg.sender);
    }

    function batchSetKYCStatus(address[] calldata accounts, KYCStatus[] calldata statuses) external onlyRole(KYC_MANAGER_ROLE) {
        uint256 len = accounts.length;
        if (len != statuses.length) revert Errors.InvalidEndTime(len, statuses.length);
        if (len > 200) revert Errors.InvalidDuration(len, 200);
        for (uint256 i; i < len; ++i) {
            address account = accounts[i];
            if (account == address(0)) revert Errors.ZeroAddress();
            _kycStatus[account] = statuses[i];
            emit KYCStatusUpdated(account, statuses[i], msg.sender);
        }
    }

    function whitelistToken(address token) external onlyRole(PROTOCOL_ADMIN_ROLE) {
        if (token == address(0)) revert Errors.ZeroAddress();
        _tokenWhitelist[token] = true;
        emit TokenWhitelisted(token, msg.sender);
    }

    function dewhitelistToken(address token) external onlyRole(PROTOCOL_ADMIN_ROLE) {
        if (token == address(0)) revert Errors.ZeroAddress();
        _tokenWhitelist[token] = false;
        emit TokenDewhitelisted(token, msg.sender);
    }

    function getEmployerStatus(address employer) external view returns (EmployerStatus) {
        return _employerStatus[employer];
    }

    function getEmployerSuspendReason(address employer) external view returns (string memory) {
        return _suspensionReason[employer];
    }

    function getKYCStatus(address account) external view returns (KYCStatus) {
        return _kycStatus[account];
    }

    function isEmployerActive(address employer) external view returns (bool) {
        return _employerStatus[employer] == EmployerStatus.Active;
    }

    function isKYCApproved(address account) external view returns (bool) {
        return _kycStatus[account] == KYCStatus.Approved;
    }

    function isTokenWhitelisted(address token) external view returns (bool) {
        return _tokenWhitelist[token];
    }
}
