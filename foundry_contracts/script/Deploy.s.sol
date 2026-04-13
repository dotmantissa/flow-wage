// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PayrollRegistry} from "../src/PayrollRegistry.sol";
import {FlowWageFactory} from "../src/FlowWageFactory.sol";
import {WithdrawalGateway} from "../src/WithdrawalGateway.sol";
import {MockHSPGateway} from "../src/mocks/MockHSPGateway.sol";
import {MockUSDT} from "../src/mocks/MockUSDT.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address admin = vm.envOr("ADMIN_ADDRESS", deployer);

        console2.log("Deployer  :", deployer);
        console2.log("Admin     :", admin);
        console2.log("Chain ID  :", block.chainid);

        vm.startBroadcast(deployerKey);

        MockUSDT usdt = new MockUSDT();
        usdt.mint(deployer, 10_000_000 * 1e6);

        MockHSPGateway hsp = new MockHSPGateway();

        PayrollRegistry registry = new PayrollRegistry(admin);
        registry.grantRole(registry.KYC_MANAGER_ROLE(), admin);
        registry.grantRole(registry.PAUSER_ROLE(), admin);
        registry.whitelistToken(address(usdt));

        FlowWageFactory factory = new FlowWageFactory(address(registry), admin);

        WithdrawalGateway gateway = new WithdrawalGateway(admin, address(hsp));

        vm.stopBroadcast();

        console2.log("\n=== COPY TO .env ===");
        console2.log("VITE_REGISTRY_ADDRESS=%s", address(registry));
        console2.log("VITE_FACTORY_ADDRESS=%s", address(factory));
        console2.log("VITE_GATEWAY_ADDRESS=%s", address(gateway));
        console2.log("VITE_USDT_ADDRESS=%s", address(usdt));
        console2.log("VITE_HSP_ADDRESS=%s", address(hsp));
        console2.log("====================");
    }
}
