'use client'

import { ActionDrawer } from '@/components/ActionDrawer'
import { LinkComponent } from '@/components/LinkComponent'
import { useEventData } from '@/context/EventData'
import { useNotifications } from '@/context/Notification'
import { useAllowance } from '@/hooks/useAllowance'
import { CONFIG } from '@/utils/config'
import { TruncateMiddle } from '@/utils/format'
import { useQueryClient } from '@tanstack/react-query'
import { LoadingStateData } from '@/utils/types'
import { formatUnits } from 'viem/utils'
import { useAccount, useNetwork } from 'wagmi'
import { useState } from 'react'
import { erc20ABI, prepareWriteShowHub, writeShowHub } from '@/abis'
import { revalidateAll } from '@/app/actions/cache'
import { waitForTransaction, switchNetwork, prepareWriteContract, writeContract } from '@wagmi/core'
import { Alert } from '@/components/Alert'

export function Register() {
  const { chain: currentChain } = useNetwork()
  const eventData = useEventData()
  const queryClient = useQueryClient()
  const notifications = useNotifications()
  const chain = CONFIG.DEFAULT_CHAINS.find((i) => i.id === eventData.record.conditionModule.chainId)
  const { address: connectedAddress } = useAccount()
  const [address, setAddress] = useState(connectedAddress)
  const [state, setState] = useState<LoadingStateData>({
    isLoading: false,
    type: '',
    message: '',
    data: false,
  })
  const { allowance, refetch } = useAllowance(
    address,
    eventData.record.conditionModuleId,
    eventData.record.conditionModuleData.tokenAddress
  )

  function buttonText() {
    if (eventData.isCancelled) return 'Event is cancelled'
    if (!eventData.isActive || eventData.hasEnded) return 'Event has ended'
    if (eventData.isParticipant) return 'Already registered'
    if (!eventData.hasBalance)
      return `Insufficient ${eventData.record.conditionModuleData.tokenSymbol ?? 'ETH'} balance`

    return 'Register'
  }

  const actionButton = (
    <button type='button' disabled={eventData.canRegister} className='btn btn-accent btn-outline btn-sm w-full'>
      {buttonText()}
    </button>
  )

  async function Approve() {
    if (!address || !chain) {
      setState({ ...state, isLoading: false, type: 'error', message: 'Not connected' })
      return
    }

    setState({ ...state, isLoading: true, type: 'info', message: `Approving token. Sign transaction` })
    const approveConfig = await prepareWriteContract({
      chainId: eventData.record.conditionModule.chainId as any,
      address: eventData.record.conditionModuleData.tokenAddress,
      abi: erc20ABI,
      functionName: 'approve',
      args: [eventData.record.conditionModuleId, eventData.record.conditionModuleData.depositFee],
    })

    const { hash } = await writeContract(approveConfig)
    setState({ ...state, isLoading: true, type: 'info', message: 'Transaction sent. Awaiting confirmation' })

    await waitForTransaction({
      chainId: chain.id,
      hash: hash,
    })

    await notifications.Add({
      created: Date.now(),
      type: 'info',
      message: `Token Approved`,
      from: address,
      cta: {
        label: 'View transaction',
        href: `${chain?.blockExplorers?.default.url}/tx/${hash}`,
      },
      data: { hash },
    })

    await refetch()
    setState({ ...state, isLoading: false, type: 'info', message: '', data: true })
  }

  async function Register() {
    if (!address || !chain) {
      setState({ ...state, isLoading: false, type: 'error', message: 'Not connected' })
      return
    }

    setState({ ...state, isLoading: true, type: 'info', message: `Registering for event. Sign transaction` })

    try {
      if (eventData.record.conditionModuleData.tokenAddress) {
        // make sure token is approved before registration first
      }

      const txConfig = await prepareWriteShowHub({
        chainId: chain.id as any,
        functionName: 'register',
        args: [eventData.record.recordId, address, '0x'],
        value: eventData.record.conditionModuleData.tokenAddress
          ? BigInt(0)
          : BigInt(eventData.record.conditionModuleData.depositFee),
      })

      const { hash } = await writeShowHub(txConfig)

      setState({ ...state, isLoading: true, type: 'info', message: 'Transaction sent. Awaiting confirmation' })

      const data = await waitForTransaction({
        chainId: chain.id,
        confirmations: 2,
        hash: hash,
      })

      if (data.status == 'success') {
        setState({ ...state, isLoading: false, type: 'success', message: 'Successfully registered' })

        await notifications.Add({
          created: Date.now(),
          type: 'info',
          message: `Registered for ${eventData.record.metadata.title}`,
          from: address,
          cta: {
            label: 'View transaction',
            href: `${chain?.blockExplorers?.default.url}/tx/${hash}`,
          },
          data: { hash },
        })

        await revalidateAll()
        queryClient.invalidateQueries({ queryKey: ['events'] })
        eventData.refetch()

        return
      }

      setState({ ...state, isLoading: false, type: 'error', message: 'Unable to register for event' })
    } catch (e) {
      console.error(e)
      setState({ ...state, isLoading: false, type: 'error', message: 'Unable to register for event' })
    }
  }

  return (
    <ActionDrawer title='Register' actionComponent={actionButton}>
      <div className='flex flex-col justify-between h-full'>
        <div className='flex flex-col'>
          <p>
            You&apos;re registering for <strong>{eventData.record.metadata?.title}</strong>.
          </p>

          <div className='w-full divide-y divide-gray-800 text-sm gap-4 mt-4'>
            <div className='flex items-center justify-between py-2'>
              <span>Network</span>
              <span>{CONFIG.DEFAULT_CHAINS.find((i) => i.id === chain?.id)?.name}</span>
            </div>
            <div className='flex items-center justify-between py-2'>
              <span>Organizer</span>
              <span>
                <LinkComponent
                  className='underline'
                  href={`${chain?.blockExplorers?.default.url}/address/${eventData.record.createdBy}`}>
                  {TruncateMiddle(eventData.record.createdBy)}
                </LinkComponent>
              </span>
            </div>
            <div className='flex items-center justify-between py-2'>
              <span>Available Spots</span>
              <span>
                {eventData.record.registrations.length}
                {' / '}
                {eventData.record.limit > 0 ? eventData.record.limit : 'unlimited'}
              </span>
            </div>
            <div className='flex items-center justify-between py-2'>
              <span>Deposit Fee</span>
              <span>
                {formatUnits(
                  BigInt(eventData.record.conditionModuleData.depositFee),
                  eventData.record.conditionModuleData.tokenDecimals ?? 18
                )}{' '}
                {eventData.record.conditionModuleData.tokenSymbol}
              </span>
            </div>
            {eventData.record.conditionModuleData.tokenAddress && (
              <div className='flex items-center justify-between py-2'>
                <span>Current Allowance</span>
                <span>{formatUnits(allowance ?? 0, eventData.record.conditionModuleData.tokenDecimals ?? 18)}</span>
              </div>
            )}
            <p className='pt-4'>* Your deposit will be returned if you check in or if the event is cancelled.</p>
          </div>
        </div>

        <div className='flex flex-col justify-end gap-4 mt-4'>
          {state.message && <Alert type={state.type as any} message={state.message} />}

          {eventData.isParticipant && (
            <button type='button' className='btn btn-accent btn-sm w-full' disabled>
              Already registered
            </button>
          )}

          {currentChain && currentChain?.id !== chain?.id && (
            <button
              className='btn btn-accent btn-sm w-full'
              disabled={state.isLoading || state.type == 'success'}
              onClick={() => switchNetwork({ chainId: eventData.record.conditionModule.chainId as any })}>
              Switch Network
            </button>
          )}

          {currentChain &&
            currentChain?.id == chain?.id &&
            allowance < BigInt(eventData.record.conditionModuleData.depositFee) &&
            (eventData.record.conditionModule.name == 'RecipientToken' ||
              eventData.record.conditionModule.name == 'SplitToken') &&
            !eventData.isParticipant && (
              <>
                <p>
                  You need to approve the contract first to spend{' '}
                  {formatUnits(
                    BigInt(eventData.record.conditionModuleData.depositFee),
                    eventData.record.conditionModuleData.tokenDecimals ?? 18
                  )}{' '}
                  {eventData.record.conditionModuleData.tokenSymbol}. You can register for the event after.
                </p>

                <button
                  type='button'
                  disabled={state.isLoading}
                  onClick={Approve}
                  className='btn btn-accent btn-sm w-full'>
                  {state.isLoading && (
                    <>
                      Loading
                      <span className='loading loading-spinner h-4 w-4' />
                    </>
                  )}
                  {!state.isLoading && <>Approve</>}
                </button>
              </>
            )}

          {currentChain &&
            currentChain?.id == chain?.id &&
            (allowance >= BigInt(eventData.record.conditionModuleData.depositFee) ||
              eventData.record.conditionModule.name == 'RecipientEther' ||
              eventData.record.conditionModule.name == 'SplitEther') &&
            !eventData.isParticipant && (
              <button
                type='button'
                disabled={state.isLoading || eventData.isParticipant}
                onClick={Register}
                className='btn btn-accent btn-sm w-full'>
                <>Register</>
              </button>
            )}
        </div>
      </div>
    </ActionDrawer>
  )
}
