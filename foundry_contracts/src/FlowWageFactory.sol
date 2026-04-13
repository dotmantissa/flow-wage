// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FlowWageAccessControl} from "./security/FlowWageAccessControl.sol";
import {IFlowWageFactory, IPayrollRegistry} from "./interfaces/IFlowWage.sol";
import {StreamVault} from "./StreamVault.sol";
import {Errors} from "./libraries/Errors.sol";

contract FlowWageFactory is FlowWageAccessControl, IFlowWageFactory {
    IPayrollRegistry public immutable registry;

    mapping(address => address) private _vaults;
    address[] private _allVaults;
    bool private _factoryPaused;

    constructor(address registry_, address initialAdmin) FlowWageAccessControl(initialAdmin) {
        if (registry_ == address(0)) revert Errors.ZeroAddress();
        registry = IPayrollRegistry(registry_);
    }

    function deployVault() external returns (address vault) {
        if (_factoryPaused) revert Errors.ProtocolPaused();
        if (!registry.isEmployerActive(msg.sender)) revert Errors.EmployerNotRegistered(msg.sender);
        address existing = _vaults[msg.sender];
        if (existing != address(0)) revert Errors.VaultAlreadyExists(msg.sender, existing);

        bytes32 salt = keccak256(abi.encodePacked(msg.sender));
        vault = address(new StreamVault{salt: salt}(msg.sender, address(registry), address(this)));

        _vaults[msg.sender] = vault;
        _allVaults.push(vault);
        emit VaultDeployed(msg.sender, vault, salt);
    }

    function computeVaultAddress(address employer) external view returns (address predicted) {
        bytes32 salt = keccak256(abi.encodePacked(employer));
        bytes memory bytecode = abi.encodePacked(
            type(StreamVault).creationCode,
            abi.encode(employer, address(registry), address(this))
        );
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), salt, keccak256(bytecode))
        );
        predicted = address(uint160(uint256(hash)));
    }

    function emergencyPause(address employer) external onlyRole(PAUSER_ROLE) {
        address vault = _vaults[employer];
        if (vault == address(0)) revert Errors.VaultDoesNotExist(employer);
        StreamVault(vault).emergencyPause();
    }

    function unpauseVault(address employer) external onlyRole(PAUSER_ROLE) {
        address vault = _vaults[employer];
        if (vault == address(0)) revert Errors.VaultDoesNotExist(employer);
        StreamVault(vault).emergencyUnpause();
    }

    function pauseFactory() external onlyRole(PAUSER_ROLE) {
        _factoryPaused = true;
        emit FactoryPaused(msg.sender);
    }

    function unpauseFactory() external onlyRole(PAUSER_ROLE) {
        _factoryPaused = false;
        emit FactoryUnpaused(msg.sender);
    }

    function getVault(address employer) external view returns (address) {
        return _vaults[employer];
    }

    function hasVault(address employer) external view returns (bool) {
        return _vaults[employer] != address(0);
    }

    function allVaultsLength() external view returns (uint256) {
        return _allVaults.length;
    }

    function allVaults(uint256 index) external view returns (address) {
        return _allVaults[index];
    }

    function factoryPaused() external view returns (bool) {
        return _factoryPaused;
    }
}
