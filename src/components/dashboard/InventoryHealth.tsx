import { Link } from "@tanstack/react-router";

interface InventoryHealthProps {
  inventoryData: {
    lowStockCount: number;
    totalProducts: number;
  };
}

export function InventoryHealth({ inventoryData }: InventoryHealthProps) {
  const { lowStockCount, totalProducts } = inventoryData;
  const isHealthy = lowStockCount === 0;

  // Calculate percentage of healthy products
  const healthyPercentage = totalProducts > 0
    ? Math.round(((totalProducts - lowStockCount) / totalProducts) * 100)
    : 100;

  return (
    <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-lg p-6">
      <h2 className="mb-5 text-[18px] font-[600] text-[#12233D] flex items-center space-x-2">
        <span className="h-4 w-4 rounded bg-[#2563EB]/10 flex items-center justify-center text-[10px] text-[#2563EB]">
          {"•"}
        </span>
        Inventory Health
      </h2>

      {/* Main status */}
      <div className="mb-5">
        <div className="flex items-center space-x-4">
          {isHealthy ? (
            <div className="w-8 h-8 rounded-full bg-[#059669]/20 flex items-center justify-center">
              <span className="text-[12px] font-[700] text-[#059669]">✓</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#B45309]/20 flex items-center justify-center">
              <span className="text-[12px] font-[700] text-[#B45309]">!</span>
            </div>
          )}
          <div className="space-y-1">
            <p className="text-[24px] font-[700] text-[#12233D]">
              {lowStockCount} products need attention
            </p>
            <p className="text-[14px] font-[400] text-[#64748B]">
              {isHealthy
                ? "All stock levels are healthy"
                : `${lowStockCount} of ${totalProducts} products (${100 - healthyPercentage}%) require replenishment`}
            </p>
          </div>
        </div>

        {/* Visual health indicator */}
        {!isHealthy && (
          <div className="mt-4 h-2 w-full bg-[#E2E8F0] rounded overflow-hidden">
            <div
              className={`h-2 w-[${healthyPercentage}%] bg-[#059669] rounded transition-all duration-500`}
            ></div>
          </div>
        )}
      </div>

      {/* Footer link */}
      <div className="mt-4 pt-3 border-t border-[#CBD5E1]">
        <Link to="/owner/inventory" className="text-[14px] font-[600] text-[#2563EB] flex items-center space-x-1 hover:underline transition-colors">
          View inventory details →
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}