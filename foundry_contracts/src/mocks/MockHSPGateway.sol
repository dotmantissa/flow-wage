// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {FlowWageAccessControl} from "../security/FlowWageAccessControl.sol";
import {IHSPGateway} from "../interfaces/IFlowWage.sol";

contract MockHSPGateway is FlowWageAccessControl, IHSPGateway {
    using SafeERC20 for IERC20;

    enum TransferStatus {
        Pending,
        Settled,
        Failed
    }

    struct TransferRecord {
        address token;
        uint256 amount;
        bytes32 destinationRef;
        address beneficiary;
        TransferStatus status;
        uint256 settledAmount;
    }

    event TransferInitiated(bytes32 indexed transferId, address indexed token, uint256 amount, address beneficiary);
    event TransferSettled(bytes32 indexed transferId, uint256 settledAmount);

    mapping(bytes32 => TransferRecord) private _records;
    uint256 private _nonce;
    bool public shouldFail;
    uint256 public fxRate = 7_800_000;

    constructor() FlowWageAccessControl(msg.sender) {}

    function initiateTransfer(
        address token,
        uint256 amount,
        bytes32 destinationRef,
        address beneficiary
    ) external returns (bytes32 transferId) {
        if (shouldFail) revert("MOCK_HSP_FAIL");
        transferId = keccak256(abi.encodePacked(msg.sender, token, amount, destinationRef, beneficiary, _nonce++));

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        _records[transferId] = TransferRecord({
            token: token,
            amount: amount,
            destinationRef: destinationRef,
            beneficiary: beneficiary,
            status: TransferStatus.Settled,
            settledAmount: amount
        });

        emit TransferInitiated(transferId, token, amount, beneficiary);
        emit TransferSettled(transferId, amount);
    }

    function getTransferStatus(bytes32 transferId) external view returns (uint8 status, uint256 settledAmount) {
        TransferRecord memory record = _records[transferId];
        status = uint8(record.status);
        settledAmount = record.settledAmount;
    }

    function setShouldFail(bool fail) external onlyRole(PROTOCOL_ADMIN_ROLE) {
        shouldFail = fail;
    }

    function setFxRate(uint256 newFxRate) external onlyRole(PROTOCOL_ADMIN_ROLE) {
        fxRate = newFxRate;
    }

    function recoverTokens(address token, address to) external onlyRole(PROTOCOL_ADMIN_ROLE) {
        uint256 bal = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(to, bal);
    }
}
