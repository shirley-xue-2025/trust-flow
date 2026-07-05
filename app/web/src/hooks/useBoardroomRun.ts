import { useCallback, useEffect, useRef, useState } from 'react';
import type { BoardroomEnvelope, PolicyArtifact, RequestPacket } from '@trustflow/shared';
import { startSession, streamSession, type BoardroomResult } from '../api.js';

export function useBoardroomRun(
  request: RequestPacket | undefined,
  replay: string | undefined,
  onCompiled: (policy: PolicyArtifact, hash: string) => void,
  autoRun = true,
) {
  const [turns, setTurns] = useState<BoardroomEnvelope[]>([]);
  const [result, setResult] = useState<BoardroomResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  // Guards the async gap between startSession and stream attach: a re-run
  // fired in that window must not leave the older stream appending turns.
  const runSeqRef = useRef(0);
  const onCompiledRef = useRef(onCompiled);
  onCompiledRef.current = onCompiled;

  const run = useCallback(() => {
    if (!request) return;
    const seq = ++runSeqRef.current;
    esRef.current?.close();
    esRef.current = null;
    setTurns([]);
    setResult(null);
    setError(null);
    setRunning(true);

    startSession(request, replay)
      .then(({ session_id }) => {
        if (seq !== runSeqRef.current) return; // superseded by a newer run
        esRef.current = streamSession(session_id, {
          onTurn: (env) => setTurns((t) => [...t, env]),
          onResult: (r) => {
            setResult(r);
            setRunning(false);
            onCompiledRef.current(r.policy, r.policy_version_hash);
          },
          onError: (msg) => {
            setError(msg);
            setRunning(false);
          },
        });
      })
      .catch((e) => {
        setError((e as Error).message);
        setRunning(false);
      });
  }, [request, replay]);

  useEffect(() => {
    if (!autoRun || !request) return;
    run();
    return () => {
      runSeqRef.current++;
      esRef.current?.close();
      esRef.current = null;
    };
  }, [request, replay, autoRun, run]);

  const reset = useCallback(() => {
    runSeqRef.current++;
    esRef.current?.close();
    esRef.current = null;
    setTurns([]);
    setResult(null);
    setError(null);
    setRunning(false);
  }, []);

  return { turns, result, running, error, run, reset };
}
