"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMyCompletions } from "../hooks";
import { Input } from "@src/shared/components/ui/input";
import { Button } from "@src/shared/components/ui/button";
import { Search, ArrowLeft, Award, FileText, Calendar, ExternalLink } from "lucide-react";
import { formatDate } from "@src/shared/utils";

export function MyCompletionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { completions, isLoading } = useMyCompletions();

  const filteredCompletions = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return completions;
    return completions.filter(
      (c) =>
        c.module?.title?.toLowerCase().includes(query)
    );
  }, [completions, search]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink flex items-center gap-2">
            My Completions
          </h1>
          <p className="mt-1 text-base text-body">
            View history of your completed training courses and certificates.
          </p>
        </div>

        <Button
          onClick={() => router.push("/training")}
          variant="outline"
          className="h-11 rounded-full border-hairline px-5 text-sm font-semibold flex items-center gap-2 hover:bg-canvas/50"
        >
          <ArrowLeft className="h-4 w-4" />
          Active Courses
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search completed courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-md border-hairline bg-canvas pl-10 text-ink placeholder:text-muted focus-visible:border-primary"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-body text-sm">
          Loading completions history...
        </div>
      ) : filteredCompletions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-surface-card border rounded-xl">
          <Award className="h-10 w-10 text-muted mb-3" />
          <p className="text-sm text-muted">You haven't completed any training modules yet.</p>
        </div>
      ) : (
        <div className="border border-hairline rounded-xl overflow-hidden bg-surface-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline bg-canvas/30 text-xs font-semibold text-muted tracking-wider uppercase">
                  <th className="px-6 py-4">Training Module</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Completed Date</th>
                  <th className="px-6 py-4 text-right">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-sm text-ink">
                {filteredCompletions.map((completion) => (
                  <tr key={completion.id} className="hover:bg-canvas/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-ink">{completion.module?.title || "Unknown Module"}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-body">
                      {completion.scorePercent !== null && completion.scorePercent !== undefined ? (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-primary/5 text-primary text-xs font-semibold">
                          {completion.scorePercent}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-body text-xs">
                      {completion.completedAt ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted" />
                          {formatDate(completion.completedAt)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {completion.certificateUrl ? (
                        <a
                          href={completion.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-hairline text-xs font-semibold text-primary hover:bg-canvas transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No Certificate</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
