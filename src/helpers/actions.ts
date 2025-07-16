
import qs from 'qs';

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      deepMerge(target[key], source[key]);
    }
  }
  Object.assign(target || {}, source);
  return target;
}

export const updateUrlSearchParams = (data, router) => {
  // Parse the current URL
  const url = new URL(window.location.href);

  // Merge current search params with new data
  const currentParams = qs.parse(url.search, { ignoreQueryPrefix: true });
  const updatedParams = deepMerge({ ...currentParams }, data);

  // Remove any undefined or null values from updatedParams
  Object.keys(updatedParams).forEach(key => {
    if (updatedParams[key] === undefined || updatedParams[key] === null) {
      delete updatedParams[key];
    }
  });

  // Create a new query string
  const queryString = qs.stringify(updatedParams, { encode: true });

  router.push(`?${queryString}`);

  return updatedParams;
};
