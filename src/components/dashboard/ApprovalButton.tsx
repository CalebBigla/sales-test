import { Link } from "@tanstack/react-router";

export default function ApprovalButton({ linkTo }: { linkTo: string }) {
  return (
    <Link to={linkTo} className="mt-4 inline-flex items-center px-4 py-2 bg-[#2563EB] text-white rounded-lg font-[600] hover:bg-[#1d4ed8] transition-colors">
      Review →
    </Link>
  );
}