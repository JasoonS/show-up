import { prepareWriteShowHub, writeShowHub } from '@/abis'
import { ActionDrawer } from '@/components/ActionDrawer'
import { useEventData } from '@/context/EventData'
import { useNotifications } from '@/context/Notification'
import { CONFIG } from '@/utils/config'
import { LoadingState } from '@/utils/types'
import { useNetwork, useQueryClient, useAccount } from 'wagmi'
import { waitForTransaction, switchNetwork } from '@wagmi/core'
import { useState } from 'react'
import { revalidateAll } from '@/app/actions/cache'
import { Alert } from '@/components/Alert'

export function Settle() {
  const { chain: currentChain } = useNetwork()
  const eventData = useEventData()
  const notifications = useNotifications()
  const queryClient = useQueryClient()
  const chain = CONFIG.DEFAULT_CHAINS.find((i) => i.id === eventData.record.conditionModule.chainId)
  const { address } = useAccount()
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    type: '',
    message: '',
  })
  const actionButton = (
    <button type='button' className='btn btn-secondary btn-outline btn-sm w-full' disabled={!eventData.canSettle}>
      Settle Event
    </button>
  )

  async function Settle() {
    if (!address || !chain) {
      setState({ ...state, isLoading: false, type: 'error', message: 'Not connected' })
      return
    }

    setState({ ...state, isLoading: true, type: 'info', message: `Settling event. Sign transaction` })

    try {
      const txConfig = await prepareWriteShowHub({
        chainId: chain.id as any,
        functionName: 'settle',
        args: [eventData.record.recordId, '0x'],
      })

      const { hash } = await writeShowHub(txConfig)

      setState({ ...state, isLoading: true, type: 'info', message: 'Transaction sent. Awaiting confirmation' })

      const data = await waitForTransaction({
        chainId: chain.id,
        confirmations: 2,
        hash: hash,
      })

      if (data.status == 'success') {
        setState({ ...state, isLoading: false, type: 'success', message: 'Event settled' })

        await notifications.Add({
          created: Date.now(),
          type: 'success',
          message: `Event settled`,
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

      setState({ ...state, isLoading: false, type: 'error', message: 'Unable to settle event' })
    } catch (e) {
      setState({ ...state, isLoading: false, type: 'error', message: 'Unable to settle event' })
    }
  }

  return (
    <ActionDrawer title='Settle Event' actionComponent={actionButton}>
      <div className='flex flex-col h-full'>
        <div className='flex-1 flex-grow'>
          <p>
            Settling an event is final and no changes can be made after. Make sure you have checked in all attendees.
          </p>
        </div>

        <div className='flex flex-col justify-end gap-4 mt-4'>
          {state.message && <Alert type={state.type as any} message={state.message} />}

          {currentChain && currentChain?.id !== chain?.id && (
            <button
              className='btn btn-accent btn-sm w-full'
              disabled={state.isLoading || state.type == 'success'}
              onClick={() => switchNetwork({ chainId: eventData.record.conditionModule.chainId as any })}>
              Switch Network
            </button>
          )}

          {currentChain && currentChain?.id === chain?.id && (
            <button
              type='button'
              disabled={state.isLoading || !eventData.canSettle}
              onClick={Settle}
              className='btn btn-accent btn-sm w-full'>
              {state.isLoading && (
                <>
                  Loading
                  <span className='loading loading-spinner h-4 w-4' />
                </>
              )}
              {!state.isLoading && <>Settle Event</>}
            </button>
          )}
        </div>
      </div>
    </ActionDrawer>
  )
}
