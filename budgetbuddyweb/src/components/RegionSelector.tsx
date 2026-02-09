import { useRegion } from '../contexts/useRegion';
import type { Region } from '../lib/regionConfig';
import { REGION_CONFIGS } from '../lib/regionConfig';

export const RegionSelector = () => {
  const { region, setRegion } = useRegion();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="region-select" className="text-sm font-medium text-gray-700">
        Region:
      </label>
      <select
        id="region-select"
        value={region}
        onChange={(e) => setRegion(e.target.value as Region)}
        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {Object.values(REGION_CONFIGS).map((config) => (
          <option key={config.code} value={config.code}>
            {config.currencySymbol} {config.name}
          </option>
        ))}
      </select>
    </div>
  );
};
