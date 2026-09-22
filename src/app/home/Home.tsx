import { Fragment, useEffect, useState } from "react";
import "./Home.scss";
import Upload from "cloudmr-ux/core/app/upload/Upload";
import { CmrCollapse, CmrPanel, CmrConfirmation } from "cloudmr-ux";
import { useAppSelector } from "../../features/hooks";
import { Box, Card, CardContent, CardHeader, IconButton, Tooltip, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { CLOUDMR_SERVER } from "../../env";

const APP_NAME = "CAMRIE";

// ── helpers ───────────────────────────────────────────────────────────────────

function normalizeToken(t: any) {
  if (!t) return null;
  if (typeof t === "string") return t;
  if (typeof t === "object") {
    if (typeof t.id_token === "string") return t.id_token;
    if (typeof t.accessToken === "string") return t.accessToken;
    if (typeof t.token === "string") return t.token;
    if (t.data && typeof t.data === "object") {
      if (typeof t.data.id_token === "string") return t.data.id_token;
      if (typeof t.data.accessToken === "string") return t.data.accessToken;
      if (typeof t.data.token === "string") return t.data.token;
    }
  }
  return null;
}

async function fetchCalculationCount(
  appName: string,
  mode: string,
  token: any,
  apiServer = CLOUDMR_SERVER,
) {
  const tokenStr = normalizeToken(token);
  if (!tokenStr) throw new Error("Authentication token not found or in unknown shape. Please login.");
  const params = new URLSearchParams({ cloudapp_name: appName, mode });
  const base = apiServer.replace(/\/$/, "");
  const url = `${base}/pipeline/count_calculations?${params.toString()}`;
  const resp = await fetch(url, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenStr}` },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`API error: ${resp.status} - ${text}`);
  }
  return resp.json();
}

function extractCount(resp: any): number {
  if (resp == null) return 0;
  if (typeof resp === "number") return resp;
  if (typeof resp.count === "number") return resp.count;
  if (resp.data && typeof resp.data.count === "number") return resp.data.count;
  if (resp.results && typeof resp.results.count === "number") return resp.results.count;
  return 0;
}

function normalizeUnitsPayload(payload: any, mode?: string): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.computingUnits)) return payload.computingUnits;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  if (mode && Array.isArray(payload[mode])) return payload[mode];
  if (Array.isArray(payload.mode_1) || Array.isArray(payload.mode_2)) {
    return Array.isArray(payload[mode ?? "mode_1"]) ? payload[mode ?? "mode_1"] : [];
  }
  return [];
}

async function fetchComputingUnits(
  appName: string,
  mode: string,
  token: any,
  apiServer = CLOUDMR_SERVER,
) {
  const tokenStr = normalizeToken(token);
  if (!tokenStr) throw new Error("Authentication token not found or in unknown shape. Please login.");
  const params = new URLSearchParams({ app_name: appName, mode });
  const base = apiServer.replace(/\/$/, "");
  const url = `${base}/computing-unit/list?${params.toString()}`;
  const resp = await fetch(url, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenStr}` },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`API error: ${resp.status} - ${text}`);
  }
  return resp.json();
}

async function deleteComputingUnitById(
  computingUnitId: string,
  token: any,
  apiServer = CLOUDMR_SERVER,
) {
  const tokenStr = normalizeToken(token);
  if (!tokenStr) throw new Error("Authentication token not found. Please login.");
  const base = apiServer.replace(/\/$/, "");
  const url = `${base}/computing-unit/delete`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenStr}` },
    body: JSON.stringify({ computingUnitId }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`API error: ${resp.status} - ${text}`);
  }
  return resp.json();
}

// ── component ─────────────────────────────────────────────────────────────────

const Home = () => {
  const [counts, setCounts] = useState<{ mode_1: number | null; mode_2: number | null }>({
    mode_1: null,
    mode_2: null,
  });
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [errorCounts, setErrorCounts] = useState<string | null>(null);
  const [units, setUnits] = useState({ mode_2: [] as any[] });
  const [deletingUnitIds, setDeletingUnitIds] = useState<Record<string, boolean>>({});

  // Used by the computing-unit error dialog
  const [name] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [color, setColor] = useState<
    "inherit" | "primary" | "secondary" | "success" | "error" | "info" | "warning" | undefined
  >(undefined);
  const [open, setOpen] = useState(false);
  const [confirmCallback, setConfirmCallback] = useState<() => void>(() => {});
  const [cancelCallback, setCancelCallback] = useState<() => void>(() => {});

  const getUnitId = (u: any, idx: number) =>
    String(u?.computingUnitId ?? u?.computing_unit_id ?? u?.id ?? u?.appId ?? u?.name ?? idx);

  const getUnitTitle = (u: any, idx: number) =>
    String(u?.referenceCode ?? u?.alias ?? u?.name ?? u?.label ?? getUnitId(u, idx));

  const { logged_in_token, accessToken } = useAppSelector((state) => state.authenticate);
  const apiToken = logged_in_token || accessToken;

  useEffect(() => {
    let cancelled = false;
    async function loadCounts() {
      setLoadingCounts(true);
      setErrorCounts(null);
      try {
        const [res1, res2, units2] = await Promise.all([
          fetchCalculationCount(APP_NAME, "mode_1", apiToken),
          fetchCalculationCount(APP_NAME, "mode_2", apiToken),
          fetchComputingUnits(APP_NAME, "mode_2", apiToken),
        ]);
        if (!cancelled) {
          setCounts({ mode_1: extractCount(res1), mode_2: extractCount(res2) });
          setUnits({ mode_2: normalizeUnitsPayload(units2, "mode_2") });
        }
      } catch (e: any) {
        if (!cancelled) setErrorCounts(e?.message || String(e));
      } finally {
        if (!cancelled) setLoadingCounts(false);
      }
    }
    if (apiToken) loadCounts();
    else setErrorCounts("No authentication token found. Please login.");
    return () => { cancelled = true; };
  }, [apiToken]);

  return (
    <Fragment>
      {/* Jobs Count */}
      <CmrCollapse accordion={false} defaultActiveKey={[0]} expandIconPosition="right">
        <CmrPanel header="Jobs Count" className="mb-2">
          {loadingCounts ? (
            <div>Loading calculation counts...</div>
          ) : errorCounts ? (
            <div style={{ color: "red" }}>Error: {errorCounts}</div>
          ) : (
            <>
              <Typography variant="body2">Mode 1 (Cloud MR AWS): {counts.mode_1}</Typography>
              {counts.mode_2 !== null && counts.mode_2 > 0 && (
                <Typography variant="body2">Mode 2: {counts.mode_2}</Typography>
              )}
            </>
          )}
        </CmrPanel>
      </CmrCollapse>

      {/* Mode 2 Computing Units */}
      {units.mode_2.length > 0 && (
        <CmrCollapse accordion={false} defaultActiveKey={[0]} expandIconPosition="right">
          <CmrPanel header="Mode 2 Computing Units" className="mb-2">
            <Box>
              {units.mode_2.map((u: any, idx: number) => {
                const unitId = getUnitId(u, idx);
                const isDeleting = !!deletingUnitIds[unitId];
                return (
                  <Card variant="outlined" key={unitId}>
                    <CardHeader
                      subheader={
                        <span>
                          <strong>{u.alias}</strong>{" "}
                          <span style={{ color: "#777", fontWeight: 400 }}>({getUnitTitle(u, idx)})</span>
                        </span>
                      }
                      sx={{
                        backgroundColor: "#F7F7F9",
                        borderBottom: "1px solid #E6E6EA",
                        "& .MuiCardHeader-subheader": { color: "#333", fontWeight: 600, fontSize: "14px" },
                      }}
                      action={
                        <Tooltip title="Delete">
                          <span>
                            <IconButton
                              aria-label="delete"
                              size="small"
                              disabled={isDeleting}
                              onClick={async () => {
                                const computingUnitId = u.computingUnitId ?? u.computing_unit_id ?? u.id;
                                const label = u.alias ?? computingUnitId ?? "this unit";
                                if (!computingUnitId) {
                                  setMessage("Missing computingUnitId on this computing unit.");
                                  setColor("error");
                                  setConfirmCallback(() => () => {});
                                  setCancelCallback(() => () => {});
                                  setOpen(true);
                                  return;
                                }
                                if (!confirm(`Are you sure you want to delete computing unit ${label}?`)) return;
                                try {
                                  setDeletingUnitIds((s) => ({ ...s, [String(computingUnitId)]: true }));
                                  await deleteComputingUnitById(String(computingUnitId), apiToken);
                                  const units2 = await fetchComputingUnits(APP_NAME, "mode_2", apiToken);
                                  setUnits((prev) => ({ ...prev, mode_2: normalizeUnitsPayload(units2, "mode_2") }));
                                } catch (e: any) {
                                  setMessage(e?.message ?? String(e));
                                  setColor("error");
                                  setConfirmCallback(() => () => {});
                                  setCancelCallback(() => () => {});
                                  setOpen(true);
                                } finally {
                                  setDeletingUnitIds((s) => {
                                    const next = { ...s };
                                    delete next[String(computingUnitId)];
                                    return next;
                                  });
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      }
                    />
                    <CardContent>
                      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1 }}>
                        {u.alias && <Typography variant="body2"><strong>Alias:</strong> {String(u.alias)}</Typography>}
                        {u.status && <Typography variant="body2"><strong>Status:</strong> {String(u.status)}</Typography>}
                        <Typography variant="body2"><strong>Mode:</strong> {String(u.mode ?? "mode_2")}</Typography>
                        {u.provider && <Typography variant="body2"><strong>Provider:</strong> {String(u.provider)}</Typography>}
                        {u.region && <Typography variant="body2"><strong>Region:</strong> {String(u.region)}</Typography>}
                        {(u.awsAccountId || u.aws_account_id) && <Typography variant="body2"><strong>AWS Account:</strong> {String(u.awsAccountId ?? u.aws_account_id)}</Typography>}
                        {u.isDefault !== undefined && <Typography variant="body2"><strong>Default:</strong> {u.isDefault ? "Yes" : "No"}</Typography>}
                        {(u.createdAt || u.created_at) && <Typography variant="body2"><strong>Created:</strong> {new Date(u.createdAt ?? u.created_at).toLocaleDateString()}</Typography>}
                        {(u.updatedAt || u.updated_at) && <Typography variant="body2"><strong>Updated:</strong> {new Date(u.updatedAt ?? u.updated_at).toLocaleDateString()}</Typography>}
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </CmrPanel>
        </CmrCollapse>
      )}

      {/* Uploaded Data — shared cloudmr-ux component, CAMRIE teal theme */}
      <Upload
        headerBgColor="#E3F1F6"
        headerTextColor="#333"
        headerIconColor="#1578A1"
        checkboxCheckedColor="#1578A1"
      />

      {/* Error dialog for computing unit operations */}
      <CmrConfirmation
        name={name}
        message={message}
        color={color}
        open={open}
        setOpen={setOpen}
        confirmCallback={confirmCallback}
        cancelCallback={cancelCallback}
        cancellable={true}
        width={450}
      />

      <div style={{ height: "69px" }}></div>
    </Fragment>
  );
};

export default Home;
