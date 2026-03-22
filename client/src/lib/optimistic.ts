/**
 * Optimistic Update Helpers — instant UI feedback for mutations.
 * 
 * Usage:
 *   const utils = trpc.useUtils();
 *   const mutation = trpc.clients.update.useMutation(
 *     optimisticUpdate(utils.clients.list, (old, input) =>
 *       old.map(c => c.id === input.id ? { ...c, ...input } : c)
 *     )
 *   );
 */

type MutationCallbacks<TInput, TData> = {
  onMutate?: (input: TInput) => Promise<{ previousData: TData | undefined }>;
  onError?: (err: unknown, input: TInput, context: { previousData: TData | undefined } | undefined) => void;
  onSettled?: () => void;
};

/**
 * Creates optimistic update mutation options for tRPC.
 * 
 * @param queryUtils - The tRPC query utils to invalidate (e.g., utils.clients.list)
 * @param updater - Function that produces the optimistic data: (oldData, newInput) => newData
 * @param extraCallbacks - Optional additional callbacks (onSuccess, etc.)
 */
export function optimisticUpdate<TInput, TData>(
  queryUtils: {
    getData: () => TData | undefined;
    setData: (updater: undefined, data: TData | undefined) => void;
    invalidate: () => void;
  },
  updater: (currentData: TData, input: TInput) => TData,
  extraCallbacks?: {
    onSuccess?: (data: unknown, input: TInput) => void;
    onError?: (err: unknown) => void;
  }
): MutationCallbacks<TInput, TData> {
  return {
    onMutate: async (input: TInput) => {
      // Snapshot the previous value
      const previousData = queryUtils.getData();

      // Optimistically update
      if (previousData !== undefined) {
        queryUtils.setData(undefined, updater(previousData, input));
      }

      return { previousData };
    },
    onError: (_err: unknown, _input: TInput, context) => {
      // Rollback on error
      if (context?.previousData !== undefined) {
        queryUtils.setData(undefined, context.previousData);
      }
      extraCallbacks?.onError?.(_err);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryUtils.invalidate();
    },
  };
}

/**
 * Creates optimistic delete mutation options.
 * Filters out the deleted item from the list immediately.
 */
export function optimisticDelete<TItem extends { id: number }>(
  queryUtils: {
    getData: () => TItem[] | undefined;
    setData: (updater: undefined, data: TItem[] | undefined) => void;
    invalidate: () => void;
  },
  extraCallbacks?: {
    onSuccess?: () => void;
    onError?: (err: unknown) => void;
  }
) {
  return {
    onMutate: async (input: { id: number }) => {
      const previousData = queryUtils.getData();
      if (previousData) {
        queryUtils.setData(undefined, previousData.filter(item => item.id !== input.id));
      }
      return { previousData };
    },
    onError: (_err: unknown, _input: { id: number }, context: { previousData: TItem[] | undefined } | undefined) => {
      if (context?.previousData) {
        queryUtils.setData(undefined, context.previousData);
      }
      extraCallbacks?.onError?.(_err);
    },
    onSettled: () => {
      queryUtils.invalidate();
      extraCallbacks?.onSuccess?.();
    },
  };
}

/**
 * Creates optimistic add mutation options.
 * Adds the new item to the beginning of the list with a temporary ID.
 */
export function optimisticAdd<TItem extends { id: number }, TInput>(
  queryUtils: {
    getData: () => TItem[] | undefined;
    setData: (updater: undefined, data: TItem[] | undefined) => void;
    invalidate: () => void;
  },
  transformer: (input: TInput) => Omit<TItem, 'id'>,
  extraCallbacks?: {
    onSuccess?: (data: unknown) => void;
    onError?: (err: unknown) => void;
  }
) {
  return {
    onMutate: async (input: TInput) => {
      const previousData = queryUtils.getData();
      if (previousData) {
        const tempItem = {
          ...transformer(input),
          id: -Date.now(), // Temporary negative ID
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as TItem;
        queryUtils.setData(undefined, [tempItem, ...previousData]);
      }
      return { previousData };
    },
    onError: (_err: unknown, _input: TInput, context: { previousData: TItem[] | undefined } | undefined) => {
      if (context?.previousData) {
        queryUtils.setData(undefined, context.previousData);
      }
      extraCallbacks?.onError?.(_err);
    },
    onSettled: () => {
      queryUtils.invalidate();
    },
  };
}
