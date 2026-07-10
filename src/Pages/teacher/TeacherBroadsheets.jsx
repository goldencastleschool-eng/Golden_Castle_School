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

function TeacherBroadsheets() {
  const { user } = useAuth();
  const [broadsheets, setBroadsheets] = useState([]);
  const [selectedBroadsheetId, setSelectedBroadsheetId] = useState("");
  const [viewerUrl, setViewerUrl] = useState("");
  const [loadingBroadsheets, setLoadingBroadsheets] = useState(true);
  const [loadingViewer, setLoadingViewer] = useState(false);
  const [error, setError] = useState("");
  const viewerRef = useRef(null);

  const selectedBroadsheet = useMemo(
    () =>
      broadsheets.find(
        (broadsheet) => broadsheet._id === selectedBroadsheetId
      ),
    [broadsheets, selectedBroadsheetId]
  );

  useEffect(() => {
    const fetchBroadsheets = async () => {
      try {
        setLoadingBroadsheets(true);
        setError("");

        const response = await API.get("/class-broadsheets/teacher");
        const broadsheetList = response.data || [];

        setBroadsheets(broadsheetList);

        if (broadsheetList.length > 0) {
          setSelectedBroadsheetId(broadsheetList[0]._id);
        }
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            requestError.response?.data?.error ||
            "Unable to load your class broadsheets."
        );
      } finally {
        setLoadingBroadsheets(false);
      }
    };

    fetchBroadsheets();
  }, []);

  const loadPdf = useCallback(async () => {
    if (!selectedBroadsheetId) {
      return;
    }

    try {
      setLoadingViewer(true);
      setError("");

      const response = await API.get(
        `/class-broadsheets/${selectedBroadsheetId}/view`,
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
        requestError.response?.data?.message ||
          "Unable to load this broadsheet PDF."
      );
    } finally {
      setLoadingViewer(false);
    }
  }, [selectedBroadsheetId]);

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
    if (!selectedBroadsheet) {
      return;
    }

    try {
      setError("");

      const downloadPath = `/class-broadsheets/${selectedBroadsheet._id}/download`;

      if (openPdfNativelyOnIOS(downloadPath)) {
        return;
      }

      await downloadPdfBlob({
        path: downloadPath,
        fileName:
          selectedBroadsheet.file_name ||
          `${selectedBroadsheet.class}-${selectedBroadsheet.term}-${selectedBroadsheet.session}-broadsheet.pdf`,
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to download this broadsheet."
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
          description="View and download the class broadsheet currently approved by admin."
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
            Approved Records
          </h3>
          <p className="mt-2 text-primary/70">
            Only broadsheets opened by admin appear here.
          </p>

          <div className="mt-6 space-y-3">
            {loadingBroadsheets ? (
              Array.from({ length: 3 }, (_, index) => (
                <div
                  key={`broadsheet-skeleton-${index}`}
                  className="animate-pulse rounded-lg bg-primary/5 p-5"
                >
                  <div className="h-4 w-32 rounded-full bg-primary/15"></div>
                  <div className="mt-3 h-3 w-44 rounded-full bg-primary/10"></div>
                </div>
              ))
            ) : broadsheets.length === 0 ? (
              <p className="rounded-lg bg-primary/5 p-5 text-primary/70">
                No class broadsheet is currently available.
              </p>
            ) : (
              broadsheets.map((broadsheet) => (
                <button
                  key={broadsheet._id}
                  type="button"
                  onClick={() => setSelectedBroadsheetId(broadsheet._id)}
                  className={`w-full rounded-lg border p-5 text-left transition-all duration-300 ${
                    selectedBroadsheetId === broadsheet._id
                      ? "border-button bg-button text-secondary"
                      : "border-primary/10 bg-primary/5 text-primary hover:border-button"
                  }`}
                >
                  <p className="font-extrabold uppercase">
                    {broadsheet.class}
                  </p>
                  <p className="mt-1 text-sm opacity-75">
                    {broadsheet.session} - {broadsheet.term}
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
                {selectedBroadsheet
                  ? `${selectedBroadsheet.class.toUpperCase()} Broadsheet`
                  : "Broadsheet Preview"}
              </h3>
              <p className="mt-2 text-primary/70">
                {selectedBroadsheet
                  ? `${selectedBroadsheet.session} - ${selectedBroadsheet.term}`
                  : "Select a broadsheet to preview."}
              </p>
            </div>

            <div className="hidden md:block"></div>
          </div>

          <PdfViewer
            title="Class Broadsheet PDF"
            viewerUrl={viewerUrl}
            loading={loadingViewer}
            emptyMessage="No broadsheet selected."
            onDownload={handleDownload}
            onReload={loadPdf}
            downloadDisabled={!selectedBroadsheet}
          />
        </section>
      </div>
    </div>
  );
}

export default TeacherBroadsheets;

