// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Errors} from "../libraries/Errors.sol";

abstract contract FlowWageAccessControl {
    bytes32 public constant DEFAULT_ADMIN_ROLE  = bytes32(0);
    bytes32 public constant PROTOCOL_ADMIN_ROLE = keccak256("PROTOCOL_ADMIN");
    bytes32 public constant KYC_MANAGER_ROLE    = keccak256("KYC_MANAGER");
    bytes32 public constant PAUSER_ROLE         = keccak256("PAUSER");
    bytes32 public constant VAULT_DEPLOYER_ROLE = keccak256("VAULT_DEPLOYER");

    mapping(bytes32 => mapping(address => bool)) private _roles;
    mapping(bytes32 => bytes32) private _roleAdmin;
    address private _admin;
    address private _pendingAdmin;

    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
    event AdminTransferStarted(address indexed currentAdmin, address indexed pendingAdmin);
    event AdminTransferCompleted(address indexed newAdmin);

    constructor(address initialAdmin) {
        if (initialAdmin == address(0)) revert Errors.ZeroAddress();
        _admin = initialAdmin;
        _roles[DEFAULT_ADMIN_ROLE][initialAdmin]  = true;
        _roles[PROTOCOL_ADMIN_ROLE][initialAdmin] = true;
        _roleAdmin[KYC_MANAGER_ROLE]    = PROTOCOL_ADMIN_ROLE;
        _roleAdmin[PAUSER_ROLE]         = PROTOCOL_ADMIN_ROLE;
        _roleAdmin[VAULT_DEPLOYER_ROLE] = PROTOCOL_ADMIN_ROLE;
        emit RoleGranted(DEFAULT_ADMIN_ROLE, initialAdmin, address(0));
        emit RoleGranted(PROTOCOL_ADMIN_ROLE, initialAdmin, address(0));
    }

    modifier onlyRole(bytes32 role) {
        if (!hasRole(role, msg.sender)) revert Errors.AccessDenied(msg.sender, role);
        _;
    }

    modifier onlyAdmin() {
        if (msg.sender != _admin) revert Errors.AccessDenied(msg.sender, DEFAULT_ADMIN_ROLE);
        _;
    }

    function hasRole(bytes32 role, address account) public view returns (bool) {
        return _roles[role][account];
    }

    function grantRole(bytes32 role, address account) external {
        if (role == DEFAULT_ADMIN_ROLE || role == PROTOCOL_ADMIN_ROLE) {
            if (msg.sender != _admin) revert Errors.AccessDenied(msg.sender, DEFAULT_ADMIN_ROLE);
        } else {
            if (!hasRole(_roleAdmin[role], msg.sender)) {
                revert Errors.AccessDenied(msg.sender, _roleAdmin[role]);
            }
        }
        if (account == address(0)) revert Errors.ZeroAddress();
        _roles[role][account] = true;
        emit RoleGranted(role, account, msg.sender);
    }

    function revokeRole(bytes32 role, address account) external {
        if (role == DEFAULT_ADMIN_ROLE || role == PROTOCOL_ADMIN_ROLE) {
            if (msg.sender != _admin) revert Errors.AccessDenied(msg.sender, DEFAULT_ADMIN_ROLE);
        } else {
            if (!hasRole(_roleAdmin[role], msg.sender)) {
                revert Errors.AccessDenied(msg.sender, _roleAdmin[role]);
            }
        }
        _roles[role][account] = false;
        emit RoleRevoked(role, account, msg.sender);
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert Errors.ZeroAddress();
        _pendingAdmin = newAdmin;
        emit AdminTransferStarted(_admin, newAdmin);
    }

    function acceptAdmin() external {
        if (msg.sender != _pendingAdmin) revert Errors.Unauthorised(msg.sender);
        address old = _admin;
        _admin = _pendingAdmin;
        _pendingAdmin = address(0);
        _roles[DEFAULT_ADMIN_ROLE][old] = false;
        _roles[DEFAULT_ADMIN_ROLE][_admin] = true;
        emit AdminTransferCompleted(_admin);
    }

    function admin() external view returns (address) {
        return _admin;
    }

    function pendingAdmin() external view returns (address) {
        return _pendingAdmin;
    }
}
