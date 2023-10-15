import { ethers, network, run } from 'hardhat'
import { defaultTokenMint } from '../test/utils/types'

async function main() {
    console.log('Deploying Show Up Protocol..')
    const [owner, attendee1, attendee2, attendee3, attendee4, attendee5] = await ethers.getSigners()

    console.log('NETWORK ID', network.config.chainId)
    const Registry = await ethers.getContractFactory('Registry')
    const registry = await Registry.deploy()

    const BasicEther = await ethers.getContractFactory('BasicEther')
    const basicEtherModule = await BasicEther.deploy()

    const BasicToken = await ethers.getContractFactory('BasicToken')
    const basicTokenModule = await BasicToken.deploy()

    await registry.whitelistConditionModule(basicEtherModule.address, true)
    await registry.whitelistConditionModule(basicTokenModule.address, true)

    console.log('Deployment addresses:')
    console.log('Registry:', registry.address)
    console.log('BasicEther:', basicEtherModule.address)
    console.log('BasicToken:', basicTokenModule.address)

    if (network.config.chainId === 31337) {
        const Token = await ethers.getContractFactory('Token')
        const token = await Token.deploy()
        console.log('Token:', token.address)

        await token.mint(attendee1.address, defaultTokenMint)
        await token.mint(attendee2.address, defaultTokenMint)
        await token.mint(attendee3.address, defaultTokenMint)
        await token.mint(attendee4.address, defaultTokenMint)
        await token.mint(attendee5.address, defaultTokenMint)
    }

    // TODO: Verify contracts
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
