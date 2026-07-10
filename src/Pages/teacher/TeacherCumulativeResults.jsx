import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaFilePdf } from "react-icons/fa6";

import API from "../../api/axios.jsx";
import PdfViewer from "../../components/common/PdfViewer.jsx";
import PortalWelcomeBanner from "../../components/common/PortalWelcomeBanner.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  downloadPdfBlob,
  openPdfNativelyOnIOS,
} from "../../utils/pdfDownload.js";

const CUMULATIVE_TERM = "Third Term";

const getRequestErrorMessage = async (requestError, fallbackMessage) => {
  const errorData = requestError.response?.data;

  if (errorData instanceof Blob) {
    try {
      const errorText = await errorData.text();
      const parsedError = JSON.parse(errorText);

      return parsedError.message || parsedError.error || fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  }

  return errorData?.message || errorData?.error || fallbackMessage;
};

function TeacherCumulativeResults() {
  const { user } = useAuth();
  const [cumulativeResults, setCumulativeResults] = useState([]);
  const [selectedResultId, setSelectedResultId] = useState("");
  const [viewerUrl, setViewerUrl] = useState("");
  const [loadingResults, setLoadingResults] = useState(true);
  const [loadingViewer, setLoadingViewer] = useState(false);
  const [error, setError] = useState("");
  const viewerRef = useRef(null);

  const selectedResult = useMemo(
    () => cumulativeResults.find((result) => result._id === selectedResultId),
    [cumulativeResults, selectedResultId]
  );

  useEffect(() => {
    const fetchCumulativeResults = async () => {
      try {
        setLoadingResults(true);
        setError("");

        const response = await API.get("/cumulative-results/teacher");
        const resultList = response.data || [];

        setCumulativeResults(resultList);

        if (resultList.length > 0) {
          setSelectedResultId(resultList[0]._id);
        }
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            requestError.response?.data?.error ||
            "Unable to load cumulative results."
        );
      } finally {
        setLoadingResults(false);
      }
    };

    fetchCumulativeResults();
  }, []);

  const loadPdf = useCallback(async () => {
    if (!selectedResultId) {
      return;
    }

    try {
      setLoadingViewer(true);
      setError("");

      const response = await API.get(
        `/cumulative-results/${selectedResultId}/view`,
        {
          responseType: "blob",
        }
      );

      const objectUrl = URL.createObjectURL(response.data);

      setViewerUrl((oldUrl) => {
        if (oldUrl) {
          URL.revokeObjectURL(oldUrl);
        }

        return objectUrl;
      });

      setTimeout(() => {
        viewerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (requestError) {
      setError(
        await getRequestErrorMessage(
          requestError,
          "Unable to load this cumulative result PDF."
        )
      );
    } finally {
      setLoadingViewer(false);
    }
  }, [selectedResultId]);

  useEffect(() => {
    loadPdf();
  }, [loadPdf]);

  useEffect(() => {
    return () => {
      if (viewerUrl) {
        URL.revokeObjectURL(viewerUrl);
      }
    };
  }, [viewerUrl]);

  const handleDownload = async () => {
    if (!selectedResult) {
      return;
    }

    try {
      setError("");

      const downloadPath = `/cumulative-results/${selectedResult._id}/download`;

      if (openPdfNativelyOnIOS(downloadPath)) {
        return;
      }

      await downloadPdfBlob({
        path: downloadPath,
        fileName:
          selectedResult.file_name ||
          `${selectedResult.class}-${selectedResult.session}-cumulative-result.pdf`,
      });
    } catch (requestError) {
      setError(
        await getRequestErrorMessage(
          requestError,
          "Unable to download this cumulative result."
        )
      );
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-10">
      <div className="mb-8">
        <PortalWelcomeBanner
          icon={<FaFilePdf />}
          eyebrow="Teacher Portal"
          title="Welcome,"
          name={user?.full_name || "Teacher"}
          description="View Third Term cumulative PDFs for your assigned class."
          metaItems={[
            {
              label: "Assigned Class",
              value: user?.assigned_class || "Not available",
            },
            {
              label: "Session",
              value: user?.session || "Not available",
            },
          ]}
        />
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        <aside className="rounded-lg bg-secondary p-5 shadow-lg sm:p-6">
          <h3 className="text-2xl font-extrabold text-primary">
            Approved Cumulative Results
          </h3>
          <p className="mt-2 text-primary/70">
            Only Third Term cumulative results opened by admin appear here.
          </p>

          <div className="mt-6 space-y-3">
            {loadingResults ? (
              <p className="rounded-lg bg-primary/5 p-5 text-primary/70">
                Loading cumulative results...
              </p>
            ) : cumulativeResults.length === 0 ? (
              <p className="rounded-lg bg-primary/5 p-5 text-primary/70">
                No cumulative result is currently available.
              </p>
            ) : (
              cumulativeResults.map((result) => (
                <button
                  key={result._id}
                  type="button"
                  onClick={() => setSelectedResultId(result._id)}
                  className={`w-full rounded-lg border p-5 text-left transition-all duration-300 ${
                    selectedResultId === result._id
                      ? "border-button bg-button text-secondary"
                      : "border-primary/10 bg-primary/5 text-primary hover:border-button"
                  }`}
                >
                  <p className="font-extrabold uppercase">
                    {result.class || "Assigned class"}
                  </p>
                  <p className="mt-1 text-sm opacity-75">
                    {result.session} - {CUMULATIVE_TERM} -{" "}
                    {result.class?.toUpperCase()}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        <section
          ref={viewerRef}
          className="rounded-lg bg-secondary p-6 shadow-lg"
        >
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h3 className="text-2xl font-extrabold text-primary sm:text-3xl">
                {selectedResult
                  ? `${selectedResult.class?.toUpperCase() || "Class"} Cumulative Result`
                  : "Cumulative Result Preview"}
              </h3>
              <p className="mt-2 text-primary/70">
                {selectedResult
                  ? `${selectedResult.session} - ${CUMULATIVE_TERM}`
                  : "Select a cumulative result to preview."}
              </p>
            </div>

            <div className="hidden md:block"></div>
          </div>

          <PdfViewer
            title="Cumulative Result PDF"
            viewerUrl={viewerUrl}
            loading={loadingViewer}
            emptyMessage="No cumulative result selected."
            onDownload={handleDownload}
            onReload={loadPdf}
            downloadDisabled={!selectedResult}
          />
        </section>
      </div>
    </div>
  );
}

export default TeacherCumulativeResults;
