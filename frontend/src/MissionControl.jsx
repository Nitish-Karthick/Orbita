import React, { useState, useEffect, useRef } from 'react';
import { 
  UserCircle, 
  Video, 
  Activity, 
  Radar, 
  Settings, 
  History, 
  CircleDot, 
  Filter, 
  AlertTriangle 
} from 'lucide-react';

const ALERT_MAP = {
  FLY: {
    color: 'text-green-400',
    bg: 'bg-green-400/20',
    border: 'border-green-400',
    pulse: 'bg-green-400/10',
    shadow: 'drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]',
    en: 'FLY: Flight will be continued.',
    ja: '飛行を継続します。',
    act: 'ACT: CONTINUE_SEQ'
  },
  INSPECT: {
    color: 'text-secondary', // using secondary from theme
    bg: 'bg-secondary/20',
    border: 'border-secondary',
    pulse: 'bg-secondary/10',
    shadow: 'drop-shadow-[0_0_8px_#ffb95f]', // theme('colors.secondary')
    en: 'INSPECT: The plan will be reviewed.',
    ja: '計画を見直します。',
    act: 'ACT: HOLD_SEQ_EVAL'
  },
  NOGO: {
    color: 'text-error',
    bg: 'bg-error-container/20',
    border: 'border-error',
    pulse: 'bg-error/10',
    shadow: 'drop-shadow-[0_0_8px_rgba(255,180,171,0.5)]',
    en: 'NOGO: Execution will be aborted.',
    ja: '実行を中止します。',
    act: 'ACT: ABORT_SEQ_INIT'
  }
};

const MissionControl = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const [telemetry, setTelemetry] = useState({
    grid_sector: "4G-ALPHA",
    hazard_density: 0,
    kinetic_risk: "LOW",
    packet_size: 104,
    alert_state: "FLY"
  });

  const [opticalStatus, setOpticalStatus] = useState("STANDBY");
  const [acousticStatus, setAcousticStatus] = useState("Nominal");
  
  const [logs, setLogs] = useState([
    { id: 1, time: "00:00:01", type: "normal", text: "System initialization complete. Handshake verified." },
    { id: 2, time: "00:00:05", type: "normal", text: "Telemetry downlink established. Latency: 42ms." }
  ]);

  const logsEndRef = useRef(null);

  const formatTime = () => {
    const d = new Date();
    return `[${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}]`;
  };

  const addLog = (text, type = "normal") => {
    setLogs(prev => [...prev, { id: crypto.randomUUID(), time: formatTime(), type, text }]);
  };

  useEffect(() => {
    // Scroll to bottom of logs
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Telemetry Polling
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/telemetry`);
        if (response.ok) {
          const data = await response.json();
          setTelemetry(data);
          
          if (data.alert_state !== telemetry.alert_state) {
            addLog(`Alert State Change: ${data.alert_state}`, 
              data.alert_state === 'NOGO' ? 'error' : 
              data.alert_state === 'INSPECT' ? 'warning' : 'normal'
            );
          }
        }
      } catch (error) {
        console.error("Telemetry fetch error:", error);
      }
    };

    const intervalId = setInterval(fetchTelemetry, 2000);
    return () => clearInterval(intervalId);
  }, [telemetry.alert_state]);

  // Acoustic Trigger Handler
  const handleAcousticTrigger = async () => {
    addLog("Sending manual trigger request...", "normal");
    try {
      const response = await fetch(`${API_BASE_URL}/api/trigger`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === "TRIGGERED") {
          setAcousticStatus("IMPACT DETECTED");
          setOpticalStatus("ACTIVE");
          addLog(`Acoustic Trigger detected. Confidence: ${(data.confidence_score * 100).toFixed(0)}%.`, "warning");
          addLog("Attempting to align optical sensor to target vector.", "normal");
          
          // Flash the vibration baseline for 3 seconds, then nominal
          setTimeout(() => {
            setAcousticStatus("Nominal");
          }, 3000);
        } else {
          addLog(`Trigger ignored: ${data.message}`, "normal");
        }
        
        // Reset after 30 seconds for demo purposes so we can see the YOLO stream
        setTimeout(() => {
          setOpticalStatus("STANDBY");
        }, 30000);
      }
    } catch (error) {
      console.error("Trigger error:", error);
      addLog("Failed to reach trigger endpoint.", "error");
    }
  };

  const currentAlert = ALERT_MAP[telemetry.alert_state] || ALERT_MAP.FLY;

  return (
    <div className="bg-background text-on-surface h-screen w-screen overflow-hidden flex font-body-md select-none dark">
      {/* SideNavBar */}
      <nav className="bg-surface-container-low border-r border-outline-variant h-full w-20 flex-col items-center py-4 shrink-0 z-10 hidden md:flex relative">
        <div className="mb-8 flex flex-col items-center gap-1 text-center">
          <div className="w-10 h-10 rounded-full bg-surface-variant border border-outline flex items-center justify-center overflow-hidden mb-1">
            <UserCircle className="text-on-surface-variant w-6 h-6" />
          </div>
          <div className="font-label-caps text-label-caps text-primary tracking-widest">MC-01</div>
          <div className="font-label-caps text-[8px] leading-[10px] text-on-surface-variant uppercase">OPERATOR</div>
        </div>
        <div className="flex flex-col w-full gap-2">
          {/* Active Tab */}
          <button className="text-primary bg-primary/10 border-l-2 border-primary w-full py-3 flex flex-col items-center gap-1 transition-all duration-150 group">
            <Video className="w-6 h-6 group-hover:text-primary transition-colors" />
            <span className="font-label-caps text-[9px] uppercase tracking-wider">Live Feed</span>
          </button>
          {/* Inactive Tabs */}
          <button className="text-on-surface-variant hover:bg-surface-variant w-full py-3 flex flex-col items-center gap-1 transition-all duration-150 border-l-2 border-transparent group">
            <Activity className="w-6 h-6 group-hover:text-on-surface transition-colors" />
            <span className="font-label-caps text-[9px] uppercase tracking-wider group-hover:text-on-surface transition-colors">Acoustics</span>
          </button>
          <button className="text-on-surface-variant hover:bg-surface-variant w-full py-3 flex flex-col items-center gap-1 transition-all duration-150 border-l-2 border-transparent group">
            <Radar className="w-6 h-6 group-hover:text-on-surface transition-colors" />
            <span className="font-label-caps text-[9px] uppercase tracking-wider group-hover:text-on-surface transition-colors">Spatial Risk</span>
          </button>
          <button className="text-on-surface-variant hover:bg-surface-variant w-full py-3 flex flex-col items-center gap-1 transition-all duration-150 border-l-2 border-transparent group">
            <Settings className="w-6 h-6 group-hover:text-on-surface transition-colors" />
            <span className="font-label-caps text-[9px] uppercase tracking-wider group-hover:text-on-surface transition-colors">Systems</span>
          </button>
          <button className="text-on-surface-variant hover:bg-surface-variant w-full py-3 flex flex-col items-center gap-1 transition-all duration-150 border-l-2 border-transparent group">
            <History className="w-6 h-6 group-hover:text-on-surface transition-colors" />
            <span className="font-label-caps text-[9px] uppercase tracking-wider group-hover:text-on-surface transition-colors">Log</span>
          </button>
        </div>
        <div className="mt-auto mb-4 flex flex-col items-center opacity-30 pointer-events-none">
          <span className="font-label-caps text-[8px] uppercase tracking-widest text-on-surface-variant [writing-mode:vertical-lr] rotate-180">ORBITA // SYS.ON</span>
        </div>
      </nav>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Header Bar */}
        <header className="bg-surface-dim border-b border-outline-variant h-12 flex justify-between items-center px-gutter shrink-0 z-10 w-full">
          <div className="flex items-center gap-4">
            <div className="font-headline-md text-headline-md tracking-tighter text-primary uppercase flex items-center gap-2">
              <CircleDot className="text-primary w-6 h-6" />
              PROJECT ORBITA <span className="text-outline-variant opacity-50 mx-1">//</span> <span className="text-on-surface">LNT Sentinel Node</span>
            </div>
          </div>
          <div className="flex items-center gap-gutter font-data-sm text-data-sm text-on-surface-variant uppercase tracking-wide">
            <div className="flex items-center gap-2 bg-surface-container px-3 py-1 rounded-sm border border-outline-variant">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_theme('colors.primary')] animate-pulse"></span>
              Uplink: <span className="text-primary font-bold">ACTIVE</span>
            </div>
            <div className="flex items-center gap-2 border-l border-outline-variant pl-gutter">
              Crypto: <span className="text-on-surface">ECDSA-P256</span>
            </div>
            <div className="flex items-center gap-2 border-l border-outline-variant pl-gutter">
              Mode: <span className="text-secondary">SITL Simulation</span>
            </div>
          </div>
        </header>

        {/* Dashboard Grid Layout */}
        <main className="flex-1 p-stack-default flex flex-col gap-stack-default overflow-hidden bg-background relative z-0">
          {/* Top Content Section */}
          <div className="flex-1 flex flex-row gap-stack-default overflow-hidden min-h-0">
            {/* Left Panel: Optical Feed & Log */}
            <div className="w-[65%] flex flex-col gap-stack-default min-h-0">
              {/* Optical Feed Container */}
              <div className="hud-border flex-1 relative flex flex-col overflow-hidden bg-[#020810]">
                <div className="absolute inset-0 scanline z-10 pointer-events-none"></div>
                {/* Header / Controls Overlay */}
                <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start z-20 pointer-events-none">
                  <div className="font-data-sm text-data-sm text-on-surface/70 uppercase">CAM_01 // MAIN_OPTICAL</div>
                  <div className="font-data-sm text-data-sm text-on-surface/50 uppercase tracking-widest">[REC]</div>
                </div>
                {/* Video Placeholder Area */}
                <div className="flex-1 flex items-center justify-center relative">
                  <img 
                    src={opticalStatus === 'ACTIVE' ? `${API_BASE_URL}/api/video_feed` : ""} 
                    alt="Optical Feed" 
                    className={`absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen ${opticalStatus === 'ACTIVE' ? 'block' : 'hidden'}`} 
                  />
                  {opticalStatus !== 'ACTIVE' && (
                    <>
                      {/* Reticle Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <div className={`w-64 h-64 border rounded-full relative transition-colors duration-300 border-primary/50`}>
                          <div className={`absolute top-1/2 left-0 w-full h-[1px] bg-primary/50`}></div>
                          <div className={`absolute left-1/2 top-0 h-full w-[1px] bg-primary/50`}></div>
                        </div>
                      </div>
                      <Video size={64} className="text-outline-variant/40 stroke-[1.5px]" />
                    </>
                  )}
                </div>
                {/* Status Overlay */}
                <div className={`absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 border transition-colors ${opticalStatus === 'ACTIVE' ? 'border-secondary/50' : 'border-error/30'}`}>
                  <span className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_currentColor] ${opticalStatus === 'ACTIVE' ? 'bg-secondary text-secondary' : 'bg-error text-error'}`}></span>
                  <span className={`font-data-sm text-data-sm uppercase font-bold tracking-wider ${opticalStatus === 'ACTIVE' ? 'text-secondary' : 'text-error'}`}>
                    OPTICAL SUBSYSTEM: {opticalStatus}
                  </span>
                </div>
                {/* Coordinate Overlay */}
                <div className="absolute bottom-4 right-4 z-20 text-right">
                  <div className="font-data-sm text-[10px] text-primary/60 uppercase">AZ: 142.5° | EL: +12.3°</div>
                  <div className="font-data-sm text-[10px] text-primary/60 uppercase">Z: 1.00x | F: AUTO</div>
                </div>
              </div>

              {/* Event Log Container */}
              <div className="hud-border h-48 flex flex-col shrink-0">
                <div className="bg-surface-container-high border-b border-outline-variant px-3 py-1.5 flex justify-between items-center shrink-0">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">System Event Log</span>
                  <Filter className="w-3.5 h-3.5 text-on-surface-variant" />
                </div>
                <div className="flex-1 overflow-y-auto p-2 font-data-sm text-[11px] leading-[18px] flex flex-col scrollbar-thin scrollbar-thumb-outline-variant scrollbar-track-transparent">
                  {logs.map((log, index) => {
                    const isWarning = log.type === 'warning';
                    const isError = log.type === 'error';
                    const bgClass = index % 2 === 1 ? 'bg-surface-container-high/30' : '';
                    const borderClass = isWarning ? 'border-l-2 border-secondary bg-secondary/5' : isError ? 'border-l-2 border-error bg-error/5' : '';
                    const textClass = isWarning ? 'text-secondary font-bold' : isError ? 'text-error font-bold' : 'text-on-surface';
                    const timeClass = isWarning ? 'text-secondary' : isError ? 'text-error' : 'text-outline-variant';

                    return (
                      <div key={log.id} className={`flex gap-3 py-1 px-2 hover:bg-surface-variant/50 transition-colors ${bgClass} ${borderClass}`}>
                        <span className={`${timeClass} w-16 shrink-0`}>{log.time}</span>
                        <span className={textClass}>{log.text}</span>
                      </div>
                    );
                  })}
                  <div ref={logsEndRef} />
                  <div className="flex-1"></div>
                </div>
              </div>
            </div>

            {/* Right Panel: Acoustic & Hazard Cards */}
            <div className="w-[35%] flex flex-col gap-stack-default min-h-0">
              {/* Acoustic FFT Status Card */}
              <div className="hud-border flex-1 flex flex-col min-h-0 relative group">
                <div className="bg-surface-container-high border-b border-outline-variant px-3 py-2 flex justify-between items-center shrink-0">
                  <span className="font-label-caps text-label-caps text-on-surface uppercase flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Acoustic FFT Status
                  </span>
                  <button 
                    onClick={handleAcousticTrigger}
                    className="font-data-sm text-[10px] text-primary px-2 py-0.5 border border-primary/50 bg-primary/10 hover:bg-primary/30 uppercase transition-colors"
                  >
                    Simulate Impact
                  </button>
                </div>
                <div className="p-container-padding flex flex-col flex-1 gap-4">
                  <div className="flex items-baseline justify-between border-b border-outline-variant/50 pb-2">
                    <span className="font-data-sm text-data-sm text-on-surface-variant uppercase">Vibration Baseline</span>
                    <span className={`font-data-md text-data-md font-bold uppercase ${acousticStatus === 'Nominal' ? 'text-primary' : 'text-secondary animate-pulse'}`}>
                      {acousticStatus}
                    </span>
                  </div>
                  {/* Fake Waveform Graphic */}
                  <div className="flex-1 flex items-end gap-[2px] w-full pt-4 opacity-80 group-hover:opacity-100 transition-opacity">
                    {[10, 25, 15, 40, 60, 85, 70, 30, 15, 25, 10, 45, 10, 20, 5].map((h, i) => (
                      <div 
                        key={i} 
                        className="w-full bg-primary/50 transition-all duration-300"
                        style={{ height: `${acousticStatus === 'Nominal' ? h : h + Math.random() * 20}%` }}
                      ></div>
                    ))}
                  </div>
                  <div className="flex justify-between font-data-sm text-[9px] text-outline-variant uppercase pt-1 border-t border-outline-variant/50">
                    <span>0 Hz</span>
                    <span>10 kHz</span>
                    <span>20 kHz</span>
                  </div>
                </div>
              </div>

              {/* Hazard Intelligence Card */}
              <div className="hud-border flex-1 flex flex-col min-h-0 bg-surface-container relative">
                {/* Corner Accent */}
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-secondary/50 m-1 pointer-events-none"></div>
                <div className="bg-surface-container-high border-b border-outline-variant px-3 py-2 flex justify-between items-center shrink-0">
                  <span className="font-label-caps text-label-caps text-on-surface uppercase flex items-center gap-2">
                    <Radar className="w-4 h-4 text-secondary" />
                    Hazard Intelligence
                  </span>
                  <span className="font-data-sm text-[10px] text-secondary px-1.5 py-0.5 border border-secondary/30 bg-secondary/10 uppercase">
                    Active Scan
                  </span>
                </div>
                <div className="p-container-padding flex flex-col flex-1 justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="font-data-sm text-[10px] text-on-surface-variant uppercase">Grid Sector</div>
                    <div className="font-data-lg text-data-lg text-on-surface font-bold tracking-wider">{telemetry.grid_sector}</div>
                  </div>
                  <div className="h-[1px] w-full bg-outline-variant/30 my-1"></div>
                  <div className="flex flex-col gap-1">
                    <div className="font-data-sm text-[10px] text-on-surface-variant uppercase flex justify-between">
                      <span>Hazard Density</span>
                      <span className="text-on-surface">{telemetry.hazard_density}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-variant overflow-hidden">
                      <div 
                        className="h-full bg-secondary shadow-[0_0_5px_theme('colors.secondary')] transition-all duration-500 ease-out"
                        style={{ width: `${telemetry.hazard_density}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="h-[1px] w-full bg-outline-variant/30 my-1"></div>
                  <div className="flex justify-between items-center bg-surface-variant/30 p-2 border border-outline-variant/50">
                    <span className="font-data-sm text-[10px] text-on-surface-variant uppercase">Kinetic Risk</span>
                    <span className={`font-data-md text-data-md font-bold uppercase ${
                      telemetry.kinetic_risk === 'HIGH' ? 'text-error animate-pulse' : 
                      telemetry.kinetic_risk === 'MEDIUM' ? 'text-secondary' : 'text-green-400'
                    }`}>
                      {telemetry.kinetic_risk}
                    </span>
                  </div>
                  <div className="mt-auto pt-3 flex justify-between items-end border-t border-outline-variant/50">
                    <span className="font-data-sm text-[9px] text-outline-variant uppercase">Downlink Packet</span>
                    <span className="font-data-sm text-[10px] text-on-surface font-mono">CBOR / {telemetry.packet_size} bytes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Full-Width Panel: Critical Bilingual Alert Banner */}
          <div className={`shrink-0 w-full ${currentAlert.bg} border-2 ${currentAlert.border} p-3 flex flex-col sm:flex-row items-center justify-center gap-4 relative overflow-hidden group transition-colors`}>
            {/* Flashing Background effect */}
            <div className={`absolute inset-0 ${currentAlert.pulse} animate-[pulse_1s_ease-in-out_infinite]`}></div>
            <AlertTriangle className={`w-8 h-8 ${currentAlert.color} relative z-10`} />
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 relative z-10 text-center sm:text-left">
              <h2 className={`font-headline-md text-headline-md font-bold ${currentAlert.color} uppercase tracking-widest ${currentAlert.shadow}`}>
                {currentAlert.en}
              </h2>
              <span className={`${currentAlert.color} opacity-50 hidden sm:block`}>|</span>
              <h2 className={`font-body-lg text-body-lg font-bold ${currentAlert.color} tracking-widest ${currentAlert.shadow}`}>
                {currentAlert.ja}
              </h2>
            </div>
            <div className={`absolute right-4 top-1/2 -translate-y-1/2 opacity-50 font-data-sm text-[10px] ${currentAlert.color} uppercase hidden md:block`}>
              {currentAlert.act}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MissionControl;
