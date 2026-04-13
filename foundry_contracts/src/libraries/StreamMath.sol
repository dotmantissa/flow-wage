// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library StreamMath {
    uint256 internal constant SCALE_FACTOR = 1e18;
    uint256 internal constant MIN_DURATION = 1 days;
    uint256 internal constant MAX_DURATION = 5 * 365 days;

    function computeScaledRate(
        uint256 totalDeposit,
        uint256 duration
    ) internal pure returns (uint256) {
        return (totalDeposit * SCALE_FACTOR) / duration;
    }

    function computeEarned(
        uint256 scaledRate,
        uint256 streamStart,
        uint256 streamEnd,
        uint256 blockTime,
        uint256 totalDeposit
    ) internal pure returns (uint256 earned) {
        if (blockTime <= streamStart) return 0;
        uint256 effectiveTime = blockTime > streamEnd ? streamEnd : blockTime;
        uint256 elapsed = effectiveTime - streamStart;
        uint256 raw = (scaledRate * elapsed) / SCALE_FACTOR;
        earned = raw > totalDeposit ? totalDeposit : raw;
    }

    function computeClaimable(
        uint256 scaledRate,
        uint256 streamStart,
        uint256 streamEnd,
        uint256 blockTime,
        uint256 totalDeposit,
        uint256 alreadyWithdrawn
    ) internal pure returns (uint256) {
        uint256 earned = computeEarned(scaledRate, streamStart, streamEnd, blockTime, totalDeposit);
        return earned > alreadyWithdrawn ? earned - alreadyWithdrawn : 0;
    }

    function computeCancellationSplit(
        uint256 scaledRate,
        uint256 streamStart,
        uint256 streamEnd,
        uint256 blockTime,
        uint256 totalDeposit,
        uint256 alreadyWithdrawn
    ) internal pure returns (uint256 employerRefund, uint256 employeeOwed) {
        uint256 earned = computeEarned(scaledRate, streamStart, streamEnd, blockTime, totalDeposit);
        employeeOwed = earned > alreadyWithdrawn ? earned - alreadyWithdrawn : 0;
        uint256 totalClaimed = alreadyWithdrawn + employeeOwed;
        employerRefund = totalDeposit > totalClaimed ? totalDeposit - totalClaimed : 0;
    }

    function validateStreamParams(
        uint256 deposit,
        uint256 startTime,
        uint256 endTime,
        uint256 blockTime
    ) internal pure returns (bool) {
        if (deposit == 0) return false;
        if (startTime < blockTime) return false;
        if (endTime <= startTime) return false;
        uint256 duration = endTime - startTime;
        if (duration < MIN_DURATION) return false;
        if (duration > MAX_DURATION) return false;
        return true;
    }
}
