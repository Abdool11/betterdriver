import { Eye, Info } from "lucide-react";

type DemoContentNoticeProps = {
  description?: string;
};

/**
 * Visual-only disclosure for intentionally sample-backed portal sections.
 * It does not change authentication, data loading, or any record state.
 */
export default function DemoContentNotice({
  description = "The information on this screen is sample content used to demonstrate the BetterDriver experience. It is not your live driver record and cannot update it.",
}: DemoContentNoticeProps) {
  return (
    <section className="demo-content-notice" role="note" aria-label="Demonstration content notice">
      <div className="demo-content-notice-icon" aria-hidden="true">
        <Eye size={17} strokeWidth={2.25} />
      </div>
      <div>
        <div className="demo-content-notice-title">
          <Info size={14} strokeWidth={2.25} aria-hidden="true" />
          Demonstration content — not your live record
        </div>
        <p>{description}</p>
      </div>
    </section>
  );
}
