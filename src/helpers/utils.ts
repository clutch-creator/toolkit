export const getEntryInstanceId = (properties, entryInstances) => {
  const entry =
    entryInstances.find(entry => {
      const entryVariants = entry.variantIds || {};

      return Object.keys(entryVariants).every(
        varKey => entryVariants[varKey] === properties[varKey]
      );
    }) || entryInstances[0];

  return entry?.id;
};
