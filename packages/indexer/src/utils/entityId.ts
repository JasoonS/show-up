type EventWithModule = {
  chainId: number;
  params: {
    conditionModule: string;
  };
};

type EventWithEvent = {
  chainId: number;
  params: {
    id: BigInt;
  };
};

export const makeModuleId = <T extends EventWithModule>(event: T) => `${event.chainId}-${event.params.conditionModule}`
export const makeEventId = <T extends EventWithEvent>(event: T) => `${event.chainId}-${event.params.id}`
