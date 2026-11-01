import React from 'react';

export default function LectureView(v) {
  return (
    <>
    <div style={{"height": "100dvh", "minHeight": v?.ui?.minH, "padding": v?.ui?.outerPad, "display": "flex"}}>
      <div style={{"flex": "1", "minWidth": "0", "display": "flex", "gap": "12px", "background": "#F6F7F9", "border": v?.ui?.shellBorder, "borderRadius": v?.ui?.shellRadius, "padding": v?.ui?.shellPad}}>
        <main style={{"flex": "1", "minWidth": "0", "background": "#FBFBFC", "border": v?.ui?.shellBorder, "borderRadius": v?.ui?.mainRadius, "display": "flex", "flexDirection": "column", "overflow": "hidden"}}>
          <header style={{"display": "flex", "alignItems": "center", "justifyContent": "space-between", "gap": "10px", "padding": v?.ui?.headPad, "borderBottom": "1px solid #ECEEF2", "background": "#FFFFFF"}}>
            <div style={{"display": "flex", "alignItems": "center", "gap": "10px", "minWidth": "0", "flex": "1"}}>
              <div style={{"width": "42px", "height": "28px", "flexShrink": "0", "display": "flex", "alignItems": "center", "justifyContent": "center"}}>
          <img src={"/logo-mark.png"} alt={"Visync"} style={{"width": "100%", "height": "100%", "objectFit": "contain"}} />
        </div>
              <div style={{"display": "flex", "alignItems": "center", "gap": "8px", "fontSize": "13px", "minWidth": "0"}}>
                <span style={{"display": v?.ui?.crumbFile, "color": "#9A9DA8", "whiteSpace": "nowrap", "overflow": "hidden", "textOverflow": "ellipsis", "minWidth": "0", "flexShrink": "2"}}>
                  {v?.fileName}
                </span>
                <svg width={"12"} height={"12"} viewBox={"0 0 24 24"} fill={"none"} stroke={"#B4B7C0"} strokeWidth={"2"} style={{"flexShrink": "0", "display": v?.ui?.crumbFile}}>
                  <path d={"m9 6 6 6-6 6"} />
                </svg>
                <span style={{"fontWeight": "600", "whiteSpace": "nowrap", "overflow": "hidden", "textOverflow": "ellipsis", "minWidth": "0"}}>
                  {v?.cur?.no}{" "}{v?.cur?.title}
                </span>
              </div>
            </div>
            <div style={{"display": "flex", "alignItems": "center", "gap": "8px", "flexShrink": "0"}}>
              <div style={{"display": "flex", "alignItems": "center", "gap": "7px", "height": "32px", "padding": "0 12px", "borderRadius": "9px", "background": v?.recPillBg, "color": v?.recPillColor, "fontSize": "12px", "fontWeight": "600", "whiteSpace": "nowrap"}}>
                <span style={{"width": "7px", "height": "7px", "borderRadius": "50%", "background": v?.recDot}} />
                <span style={{"display": v?.ui?.textDisp}}>
                  {v?.recLabel}
                </span>
                <span style={{"fontVariantNumeric": "tabular-nums", "fontWeight": "500"}}>
                  {v?.clock}
                </span>
              </div>
              <button onClick={v?.save} style={{"display": "flex", "alignItems": "center", "gap": "6px", "height": "32px", "padding": "0 12px", "border": "1px solid #E3E5EA", "borderRadius": "9px", "background": "#FFFFFF", "color": "#2E3038", "fontSize": "12px", "fontWeight": "600", "cursor": "pointer", "whiteSpace": "nowrap"}}>
                <svg width={"13"} height={"13"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"2"}>
                  <path d={"M12 4v11M7 10l5 5 5-5M5 20h14"} />
                </svg>
                <span style={{"display": v?.ui?.textDisp}}>
                  {"노트 저장"}
                </span>
              </button>
              <button onClick={v?.openEnd} style={{"height": "32px", "padding": "0 14px", "border": "none", "borderRadius": "9px", "background": "#1C1D22", "color": "#FFFFFF", "fontSize": "12px", "fontWeight": "600", "cursor": "pointer", "whiteSpace": "nowrap"}}>
                {"수업 종료"}
              </button>
            </div>
          </header>
          <div style={{"flex": "1", "minHeight": "0", "display": "grid", "gridTemplateColumns": v?.ui?.gridCols}}>
            <nav style={{"borderRight": "1px solid #ECEEF2", "padding": "16px 10px", "display": v?.ui?.sideNav, "flexDirection": "column", "gap": "4px", "overflow": "auto"}}>
              <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "baseline", "padding": "0 8px 8px"}}>
                <span style={{"fontSize": "13px", "fontWeight": "700"}}>
                  {"강의 챕터"}
                </span>
                <span style={{"fontSize": "11px", "color": "#9A9DA8"}}>
                  {"목차 기준"}
                </span>
              </div>
              {(v?.chapters || []).map((c, c_i) => (<React.Fragment key={c_i}>
                <button onClick={c?.select} style={{"display": "grid", "gridTemplateColumns": "22px minmax(0,1fr)", "gap": "8px", "textAlign": "left", "padding": "10px 10px", "borderRadius": "10px", "border": `1px solid ${c?.border ?? ""}`, "background": c?.bg, "cursor": "pointer", "fontFamily": "inherit"}}>
                  <span style={{"fontSize": "12px", "color": c?.noColor, "fontVariantNumeric": "tabular-nums", "paddingTop": "1px"}}>
                    {c?.no}
                  </span>
                  <span style={{"display": "flex", "flexDirection": "column", "gap": "5px", "minWidth": "0"}}>
                    <span style={{"fontSize": "13px", "lineHeight": "1.4", "color": c?.titleColor, "fontWeight": c?.weight}}>
                      {c?.title}
                    </span>
                    <span style={{"display": "flex", "alignItems": "center", "gap": "6px", "fontSize": "11px", "color": c?.statusColor}}>
                      <span style={{"width": "6px", "height": "6px", "borderRadius": "50%", "background": c?.statusColor}} />
                      {c?.status}
                    </span>
                  </span>
                </button>
              </React.Fragment>))}
            </nav>
            <section style={{"minWidth": "0", "overflow": "auto", "padding": v?.ui?.secPad, "display": "flex", "flexDirection": "column", "gap": "10px"}}>
              <div style={{"display": v?.ui?.chipNav, "gap": "6px", "overflowX": "auto", "paddingBottom": "2px", "flexShrink": "0"}}>
                {(v?.chapters || []).map((c, c_i) => (<React.Fragment key={c_i}>
                  <button onClick={c?.select} style={{"display": "flex", "alignItems": "center", "gap": "6px", "height": "32px", "padding": "0 12px", "borderRadius": "9px", "border": `1px solid ${c?.chipBorder ?? ""}`, "background": c?.chipBg, "cursor": "pointer", "flexShrink": "0", "fontFamily": "inherit", "whiteSpace": "nowrap"}}>
                    <span style={{"width": "6px", "height": "6px", "borderRadius": "50%", "background": c?.statusColor}} />
                    <span style={{"fontSize": "11px", "color": c?.noColor, "fontVariantNumeric": "tabular-nums"}}>
                      {c?.no}
                    </span>
                    <span style={{"fontSize": "12px", "fontWeight": c?.weight, "color": c?.titleColor}}>
                      {c?.title}
                    </span>
                  </button>
                </React.Fragment>))}
              </div>
              <div style={{"display": "flex", "alignItems": "flex-end", "justifyContent": "space-between", "gap": "12px", "flexWrap": "wrap"}}>
                <div style={{"display": "flex", "flexDirection": "column", "gap": "4px"}}>
                  <span style={{"fontSize": "12px", "color": "#7C7FF2", "fontWeight": "600"}}>
                    {"CHAPTER "}{v?.cur?.no}
                  </span>
                  <h1 style={{"margin": "0", "fontSize": v?.ui?.h1, "fontWeight": "700", "letterSpacing": "-0.02em"}}>
                    {v?.cur?.title}
                  </h1>
                </div>
                <div style={{"display": "flex", "alignItems": "center", "gap": "10px"}}>
                  <span style={{"fontSize": "12px", "color": "#9A9DA8"}}>
                    {v?.cur?.pageLabel}
                  </span>
                  <button onClick={v?.resetLayout} style={{"display": v?.ui?.desktopOnly, "alignItems": "center", "gap": "5px", "height": "26px", "padding": "0 10px", "border": "1px solid #E8EAEE", "borderRadius": "7px", "background": "#FFFFFF", "color": "#4B4E58", "fontSize": "11px", "fontWeight": "500", "cursor": "pointer", "fontFamily": "inherit", "whiteSpace": "nowrap"}}>
                    <svg width={"11"} height={"11"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"2.2"}>
                      <rect x={"3"} y={"3"} width={"8"} height={"8"} rx={"1.5"} />
                      <rect x={"13"} y={"3"} width={"8"} height={"18"} rx={"1.5"} />
                      <rect x={"3"} y={"13"} width={"8"} height={"8"} rx={"1.5"} />
                    </svg>
                    {"배치 초기화"}
                  </button>
                </div>
              </div>
              <div style={{"display": "flex", "alignItems": "center", "gap": "10px", "minWidth": "0"}}>
                <span style={{"fontSize": "12px", "fontWeight": "600", "color": "#6E717C", "flexShrink": "0", "whiteSpace": "nowrap"}}>
                  {"시각화 기록"}
                </span>
                <div style={{"display": "flex", "gap": "6px", "overflowX": "auto", "minWidth": "0", "paddingBottom": "2px"}}>
                  {(v?.history || []).map((hi, hi_i) => (<React.Fragment key={hi_i}>
                    <button onClick={hi?.open} style={{"display": "flex", "alignItems": "center", "gap": "8px", "height": "34px", "padding": "0 12px", "borderRadius": "10px", "border": `1px solid ${hi?.border ?? ""}`, "background": hi?.bg, "cursor": "pointer", "flexShrink": "0", "fontFamily": "inherit"}}>
                      <span style={{"fontSize": "11px", "color": "#A0A3AD", "fontVariantNumeric": "tabular-nums"}}>
                        {hi?.time}
                      </span>
                      <span style={{"fontSize": "12px", "fontWeight": "600", "color": hi?.color, "whiteSpace": "nowrap"}}>
                        {hi?.title}
                      </span>
                      <span style={{"display": hi?.liveDisplay, "fontSize": "10px", "fontWeight": "700", "color": "#D2383E", "background": "#FDECEC", "padding": "2px 6px", "borderRadius": "5px"}}>
                        {"LIVE"}
                      </span>
                    </button>
                  </React.Fragment>))}
                </div>
              </div>
              <div style={{"display": v?.ui?.tabBar, "padding": "3px", "background": "#F2F3F6", "borderRadius": "10px", "gap": "2px", "flexShrink": "0"}}>
                {(v?.mtabs || []).map((mt, mt_i) => (<React.Fragment key={mt_i}>
                  <button onClick={mt?.go} style={{"flex": "1", "height": "34px", "border": "none", "borderRadius": "8px", "background": mt?.bg, "color": mt?.color, "boxShadow": mt?.shadow, "fontSize": "13px", "fontWeight": "600", "cursor": "pointer", "fontFamily": "inherit"}}>
                    {mt?.label}
                  </button>
                </React.Fragment>))}
              </div>
              <div ref={v?.boardRef} style={{"position": "relative", "flexShrink": "0", "height": v?.boardH, "display": v?.ui?.boardDisplay, "flexDirection": "column", "gap": "12px"}}>
                <div style={{"position": v?.lay?.slide?.pos, "left": v?.lay?.slide?.l, "top": v?.lay?.slide?.t, "width": v?.lay?.slide?.w, "height": v?.lay?.slide?.h, "zIndex": v?.lay?.slide?.z, "background": "#FFFFFF", "border": `1px solid ${v?.lay?.slide?.border ?? ""}`, "boxShadow": v?.lay?.slide?.shadow, "borderRadius": "14px", "display": v?.lay?.slide?.disp, "flexDirection": "column", "overflow": "hidden", "transition": "box-shadow .2s,border-color .2s"}}>
                  <div onPointerDown={v?.drag?.slide} title={"드래그해서 이동"} style={{"display": "flex", "alignItems": "center", "justifyContent": "space-between", "gap": "8px", "padding": "10px 12px", "borderBottom": "1px solid #F0F1F4", "cursor": v?.ui?.grabCursor, "userSelect": "none", "touchAction": "none", "flexShrink": "0", "position": "relative"}}>
                    <span style={{"display": "flex", "alignItems": "center", "gap": "8px", "fontSize": "13px", "fontWeight": "600", "whiteSpace": "nowrap", "minWidth": "0", "overflow": "hidden"}}>
                      <svg width={"10"} height={"14"} viewBox={"0 0 10 14"} fill={"#C2C4CC"} style={{"flexShrink": "0"}}>
                        <circle cx={"2.5"} cy={"2.5"} r={"1.3"} />
                        <circle cx={"7.5"} cy={"2.5"} r={"1.3"} />
                        <circle cx={"2.5"} cy={"7"} r={"1.3"} />
                        <circle cx={"7.5"} cy={"7"} r={"1.3"} />
                        <circle cx={"2.5"} cy={"11.5"} r={"1.3"} />
                        <circle cx={"7.5"} cy={"11.5"} r={"1.3"} />
                      </svg>
                      {"강의 자료"}
                    </span>
                    <div style={{"display": "flex", "alignItems": "center", "gap": "2px", "fontSize": "12px", "color": "#6E717C", "flexShrink": "0"}}>
                      {v?.offLive ? (<>
                        <button onClick={v?.goLive} title={"실시간 강의 위치로"} style={{"display": "flex", "alignItems": "center", "height": "22px", "padding": "0 8px", "marginRight": "4px", "border": "none", "borderRadius": "6px", "background": "#FDECEC", "color": "#D2383E", "fontSize": "11px", "fontWeight": "600", "cursor": "pointer", "fontFamily": "inherit", "whiteSpace": "nowrap"}}>
                          {"실시간 ↗"}
                        </button>
                      </>) : null}
                      <button onClick={v?.prevPage} style={{"width": "26px", "height": "26px", "border": "none", "borderRadius": "7px", "background": "transparent", "color": "#6E717C", "cursor": "pointer", "display": "flex", "alignItems": "center", "justifyContent": "center"}}>
                        <svg width={"12"} height={"12"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"2.2"}>
                          <path d={"m15 6-6 6 6 6"} />
                        </svg>
                      </button>
                      <span style={{"display": "flex", "alignItems": "center", "gap": "3px", "fontVariantNumeric": "tabular-nums", "whiteSpace": "nowrap"}}>
                        {"p."}
                        <input key={v?.page} className={"vs-pageinput"} defaultValue={v?.page} onFocus={v?.pageFocus} onKeyDown={v?.pageKey} onBlur={v?.pageBlur} inputMode={"numeric"} aria-label={"이동할 페이지 번호"} title={"페이지 번호를 입력하고 Enter"} style={{"width": v?.pageInputW, "height": "22px", "padding": "0 2px", "border": "1px solid #E3E5EA", "borderRadius": "6px", "background": "#FFFFFF", "color": "#1C1D22", "font": "inherit", "textAlign": "center", "outline": "none"}} />
                        {"/ "}{v?.totalPages}
                      </span>
                      <button onClick={v?.nextPage} style={{"width": "26px", "height": "26px", "border": "none", "borderRadius": "7px", "background": "transparent", "color": "#6E717C", "cursor": "pointer", "display": "flex", "alignItems": "center", "justifyContent": "center"}}>
                        <svg width={"12"} height={"12"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"2.2"}>
                          <path d={"m9 6 6 6-6 6"} />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div style={{"flex": "1", "minHeight": "0", "overflow": "auto", "padding": "14px", "background": "#F7F8FA", "display": "flex", "alignItems": "center", "justifyContent": "center"}}>
                    <div style={{"width": "100%", "position": "relative", "background": "#FFFFFF", "border": "1px solid #E6E7EC", "borderRadius": "6px", "boxShadow": "0 6px 20px -8px rgba(20,20,40,0.12)", "overflow": "hidden", "minHeight": "180px"}}>
                      <canvas ref={v?.canvasRef} style={{"display": "block", "width": "100%", "height": "auto"}} />
                      {v?.pdfLoading ? (<>
                        <div style={{"position": "absolute", "inset": "0", "display": "flex", "alignItems": "center", "justifyContent": "center", "fontSize": "12px", "color": "#9A9DA8", "background": "#FFFFFF"}}>
                          {v?.pdfMsg}
                        </div>
                      </>) : null}
                    </div>
                  </div>
                  <div onPointerDown={v?.resize?.slide} title={"드래그해서 크기 조절"} style={{"position": "absolute", "right": "0", "bottom": "0", "width": "20px", "height": "20px", "cursor": "nwse-resize", "display": v?.ui?.handle, "alignItems": "flex-end", "justifyContent": "flex-end", "padding": "4px", "zIndex": "3", "touchAction": "none"}}>
                    <svg width={"10"} height={"10"} viewBox={"0 0 10 10"}>
                      <path d={"M9 1L1 9M9 5L5 9"} stroke={"#B4B7C0"} strokeWidth={"1.4"} strokeLinecap={"round"} />
                    </svg>
                  </div>
                </div>
                <div style={{"position": v?.lay?.notes?.pos, "left": v?.lay?.notes?.l, "top": v?.lay?.notes?.t, "width": v?.lay?.notes?.w, "height": v?.lay?.notes?.h, "zIndex": v?.lay?.notes?.z, "background": "#FFFFFF", "border": `1px solid ${v?.lay?.notes?.border ?? ""}`, "boxShadow": v?.lay?.notes?.shadow, "borderRadius": "14px", "display": v?.lay?.notes?.disp, "flexDirection": "column", "overflow": "hidden", "transition": "box-shadow .2s,border-color .2s"}}>
                  <div onPointerDown={v?.drag?.notes} title={"드래그해서 이동"} style={{"display": "flex", "alignItems": "center", "justifyContent": "space-between", "gap": "8px", "padding": "10px 12px", "borderBottom": "1px solid #F0F1F4", "cursor": v?.ui?.grabCursor, "userSelect": "none", "touchAction": "none", "flexShrink": "0"}}>
                    <span style={{"display": "flex", "alignItems": "center", "gap": "8px", "fontSize": "13px", "fontWeight": "600", "whiteSpace": "nowrap", "minWidth": "0", "overflow": "hidden"}}>
                      <svg width={"10"} height={"14"} viewBox={"0 0 10 14"} fill={"#C2C4CC"} style={{"flexShrink": "0"}}>
                        <circle cx={"2.5"} cy={"2.5"} r={"1.3"} />
                        <circle cx={"7.5"} cy={"2.5"} r={"1.3"} />
                        <circle cx={"2.5"} cy={"7"} r={"1.3"} />
                        <circle cx={"7.5"} cy={"7"} r={"1.3"} />
                        <circle cx={"2.5"} cy={"11.5"} r={"1.3"} />
                        <circle cx={"7.5"} cy={"11.5"} r={"1.3"} />
                      </svg>
                      {"실시간 필기 노트"}
                    </span>
                    <div style={{"display": "flex", "padding": "3px", "background": "#F2F3F6", "borderRadius": "9px", "gap": "2px"}}>
                      <button onClick={v?.tabSummary} style={{"height": "26px", "padding": "0 12px", "border": "none", "borderRadius": "7px", "background": v?.sumBg, "color": v?.sumColor, "boxShadow": v?.sumShadow, "fontSize": "12px", "fontWeight": "600", "cursor": "pointer"}}>
                        {"요약"}
                      </button>
                      <button onClick={v?.tabTranscript} style={{"height": "26px", "padding": "0 12px", "border": "none", "borderRadius": "7px", "background": v?.trBg, "color": v?.trColor, "boxShadow": v?.trShadow, "fontSize": "12px", "fontWeight": "600", "cursor": "pointer"}}>
                        {"전문"}
                      </button>
                    </div>
                  </div>
                  <div ref={v?.scrollRef} style={{"flex": "1", "minHeight": "0", "overflow": "auto", "padding": "16px"}}>
                    {v?.isSummary ? (<>
                      <div style={{"display": "flex", "flexDirection": "column", "gap": "20px"}}>
                        {(v?.summary || []).map((sec, sec_i) => (<React.Fragment key={sec_i}>
                          <div style={{"display": "flex", "flexDirection": "column", "gap": "10px"}}>
                            <div style={{"display": "flex", "alignItems": "center", "gap": "8px"}}>
                              <span style={{"fontSize": "11px", "color": "#7C7FF2", "fontWeight": "700", "fontVariantNumeric": "tabular-nums"}}>
                                {sec?.no}
                              </span>
                              <span style={{"fontSize": "14px", "fontWeight": "700"}}>
                                {sec?.title}
                              </span>
                              <button onClick={sec?.go} title={"강의 자료로 이동"} style={{"marginLeft": "auto", "display": "inline-flex", "alignItems": "center", "height": "22px", "padding": "0 8px", "border": `1px solid ${sec?.pBorder ?? ""}`, "borderRadius": "6px", "background": sec?.pBg, "color": sec?.pColor, "fontSize": "11px", "fontWeight": "600", "fontFamily": "inherit", "cursor": "pointer", "whiteSpace": "nowrap", "fontVariantNumeric": "tabular-nums", "order": "9"}}>
                                {"강의 자료 p."}{sec?.range}
                              </button>
                              {sec?.live ? (<>
                                <span style={{"fontSize": "10px", "color": "#E5484D", "fontWeight": "600", "background": "#FDECEC", "padding": "2px 6px", "borderRadius": "5px"}}>
                                  {"작성 중"}
                                </span>
                              </>) : null}
                            </div>
                            <div style={{"display": "flex", "flexDirection": "column", "gap": "8px"}}>
                              {(sec?.items || []).map((it, it_i) => (<React.Fragment key={it_i}>
                                <div style={{"display": "grid", "gridTemplateColumns": "10px minmax(0,1fr)", "gap": "6px", "fontSize": "13px", "lineHeight": "1.6", "color": "#3A3C45"}}>
                                  <span style={{"color": "#B4B7C0"}}>
                                    {"•"}
                                  </span>
                                  <span>
                                    {it?.pre}
                                    <span style={{"background": "linear-gradient(transparent 55%,#E4E3FB 55%)", "fontWeight": "600", "color": "#1C1D22"}}>
                                      {it?.key}
                                    </span>
                                    {it?.post}{" "}
                                    <span title={it?.starTitle} style={{"marginLeft": "4px", "fontSize": "10px", "fontWeight": "700", "color": "#B26A12", "background": "#FDF3E3", "padding": "2px 6px", "borderRadius": "5px", "verticalAlign": "1px", "display": it?.starDisplay, "cursor": "help"}}>
                                      {"교수님 강조"}
                                    </span>
                                  </span>
                                </div>
                              </React.Fragment>))}
                            </div>
                          </div>
                        </React.Fragment>))}
                      </div>
                    </>) : null}
                    {v?.isTranscript ? (<>
                      <div style={{"display": "flex", "flexDirection": "column", "gap": "14px"}}>
                        {(v?.transcript || []).map((t, t_i) => (<React.Fragment key={t_i}>
                          <div style={{"display": "grid", "gridTemplateColumns": "40px minmax(0,1fr)", "gap": "8px"}}>
                            <span style={{"fontSize": "11px", "color": "#A0A3AD", "fontVariantNumeric": "tabular-nums", "paddingTop": "2px"}}>
                              {t?.time}
                            </span>
                            <span style={{"fontSize": "13px", "lineHeight": "1.65", "color": t?.color}}>
                              {t?.text}
                            </span>
                          </div>
                        </React.Fragment>))}
                        {v?.micEmpty ? (<>
                          <div style={{"padding": "28px 8px", "textAlign": "center", "fontSize": "12px", "lineHeight": "1.7", "color": "#9A9DA8"}}>
                            {"녹음을 시작하면 교수님 음성이 여기에 받아써져요."}
                            <br />
                            {"Chrome · Edge에서 마이크 권한을 허용해 주세요."}
                          </div>
                        </>) : null}
                      </div>
                    </>) : null}
                  </div>
                  <div style={{"margin": "12px", "padding": "12px", "border": "1px solid #E8EAF0", "borderRadius": "14px", "boxShadow": "0 10px 30px -14px rgba(90,80,200,0.18)", "display": "flex", "alignItems": "center", "gap": "12px"}}>
                    <div style={{"flex": "1", "minWidth": "0", "display": "flex", "flexDirection": "column", "gap": "6px"}}>
                      <div style={{"display": "flex", "alignItems": "center", "gap": "2px", "height": "22px"}}>
                        {(v?.wave || []).map((w, w_i) => (<React.Fragment key={w_i}>
                          <span style={{"flex": "1", "maxWidth": "4px", "borderRadius": "2px", "height": w?.h, "background": w?.c, "transition": "height .14s"}} />
                        </React.Fragment>))}
                      </div>
                      <div style={{"display": "flex", "alignItems": "center", "gap": "8px", "minWidth": "0"}}>
                        <span style={{"fontSize": "11px", "color": "#9A9DA8", "whiteSpace": "nowrap", "overflow": "hidden", "textOverflow": "ellipsis"}}>
                          {v?.recHint}
                        </span>
                        <div role={"group"} aria-label={"강의 언어"} style={{"display": "flex", "padding": "2px", "background": "#F2F3F6", "borderRadius": "7px", "gap": "2px", "flexShrink": "0"}}>
                          {(v?.langs || []).map((lg, lg_i) => (<React.Fragment key={lg_i}>
                            <button onClick={lg?.go} title={lg?.title} style={{"height": "20px", "padding": "0 7px", "border": "none", "borderRadius": "5px", "background": lg?.bg, "color": lg?.color, "boxShadow": lg?.shadow, "fontSize": "10.5px", "fontWeight": "600", "cursor": "pointer", "fontFamily": "inherit"}}>
                              {lg?.label}
                            </button>
                          </React.Fragment>))}
                        </div>
                      </div>
                    </div>
                    <button onClick={v?.toggleRec} title={v?.recBtnTitle} style={{"display": "flex", "alignItems": "center", "gap": "6px", "height": "38px", "padding": "0 14px", "border": "none", "borderRadius": "11px", "background": v?.recBtnBg, "color": v?.recBtnColor, "fontSize": "13px", "fontWeight": "600", "cursor": "pointer", "whiteSpace": "nowrap"}}>
                      <span style={{"width": "10px", "height": "10px", "borderRadius": v?.recIconRadius, "background": v?.recIconBg}} />
                      {v?.recBtnLabel}
                    </button>
                  </div>
                  <div onPointerDown={v?.resize?.notes} title={"드래그해서 크기 조절"} style={{"position": "absolute", "right": "0", "bottom": "0", "width": "20px", "height": "20px", "cursor": "nwse-resize", "display": v?.ui?.handle, "alignItems": "flex-end", "justifyContent": "flex-end", "padding": "4px", "zIndex": "3", "touchAction": "none"}}>
                    <svg width={"10"} height={"10"} viewBox={"0 0 10 10"}>
                      <path d={"M9 1L1 9M9 5L5 9"} stroke={"#B4B7C0"} strokeWidth={"1.4"} strokeLinecap={"round"} />
                    </svg>
                  </div>
                </div>
                <div style={{"position": v?.lay?.viz?.pos, "left": v?.lay?.viz?.l, "top": v?.lay?.viz?.t, "width": v?.lay?.viz?.w, "height": v?.lay?.viz?.h, "zIndex": v?.lay?.viz?.z, "background": "#FFFFFF", "border": `1px solid ${v?.lay?.viz?.border ?? ""}`, "boxShadow": v?.lay?.viz?.shadow, "borderRadius": "14px", "display": v?.lay?.viz?.disp, "flexDirection": "column", "overflow": "hidden", "transition": "box-shadow .2s,border-color .2s"}}>
                  <div style={{"position": "absolute", "inset": "0", "background": "radial-gradient(ellipse at 50% 40%, rgba(150,140,250,0.10), rgba(150,140,250,0) 60%)", "pointerEvents": "none"}} />
                  <div onPointerDown={v?.drag?.viz} title={"드래그해서 이동"} style={{"display": "flex", "alignItems": "center", "justifyContent": "space-between", "gap": "8px", "padding": "10px 12px", "borderBottom": "1px solid #F0F1F4", "cursor": v?.ui?.grabCursor, "userSelect": "none", "touchAction": "none", "flexShrink": "0", "position": "relative"}}>
                    <div style={{"display": "flex", "alignItems": "center", "gap": "8px", "minWidth": "0"}}>
                      <svg width={"10"} height={"14"} viewBox={"0 0 10 14"} fill={"#C2C4CC"} style={{"flexShrink": "0"}}>
                        <circle cx={"2.5"} cy={"2.5"} r={"1.3"} />
                        <circle cx={"7.5"} cy={"2.5"} r={"1.3"} />
                        <circle cx={"2.5"} cy={"7"} r={"1.3"} />
                        <circle cx={"7.5"} cy={"7"} r={"1.3"} />
                        <circle cx={"2.5"} cy={"11.5"} r={"1.3"} />
                        <circle cx={"7.5"} cy={"11.5"} r={"1.3"} />
                      </svg>
                      <span style={{"fontSize": "13px", "fontWeight": "600"}}>
                        {"시각화"}
                      </span>
                      <span style={{"fontSize": "11px", "color": v?.cur?.tagColor, "background": v?.cur?.tagBg, "padding": "3px 8px", "borderRadius": "6px"}}>
                        {v?.cur?.tag}
                      </span>
                      {v?.isReplay ? (<>
                        <button onClick={v?.goLive} style={{"display": "flex", "alignItems": "center", "gap": "5px", "fontSize": "11px", "fontWeight": "600", "color": "#4B4E58", "background": "#F2F3F6", "border": "none", "height": "22px", "padding": "0 8px", "borderRadius": "6px", "cursor": "pointer", "fontFamily": "inherit", "whiteSpace": "nowrap"}}>
                          {"다시 보는 중 · "}
                          <span style={{"color": "#D2383E"}}>
                            {"실시간으로 ↗"}
                          </span>
                        </button>
                      </>) : null}
                    </div>
                    {v?.cur?.hasViz ? (<>
                      <div style={{"display": "flex", "gap": "4px"}}>
                        <button onClick={v?.togglePlay} title={v?.playTitle} style={{"width": "28px", "height": "28px", "border": "1px solid #E8EAEE", "borderRadius": "8px", "background": "#FFFFFF", "color": "#4B4E58", "cursor": "pointer", "display": "flex", "alignItems": "center", "justifyContent": "center"}}>
                          <svg width={"12"} height={"12"} viewBox={"0 0 24 24"} fill={"currentColor"} style={{"display": v?.pauseIcon}}>
                            <rect x={"6"} y={"5"} width={"4"} height={"14"} rx={"1"} />
                            <rect x={"14"} y={"5"} width={"4"} height={"14"} rx={"1"} />
                          </svg>
                          <svg width={"12"} height={"12"} viewBox={"0 0 24 24"} fill={"currentColor"} style={{"display": v?.playIcon}}>
                            <path d={"M7 5v14l12-7z"} />
                          </svg>
                        </button>
                        <button onClick={v?.replay} title={"다시 재생"} style={{"width": "28px", "height": "28px", "border": "1px solid #E8EAEE", "borderRadius": "8px", "background": "#FFFFFF", "color": "#4B4E58", "cursor": "pointer", "display": "flex", "alignItems": "center", "justifyContent": "center"}}>
                          <svg width={"13"} height={"13"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"2.2"}>
                            <path d={"M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5"} />
                          </svg>
                        </button>
                      </div>
                    </>) : null}
                  </div>
                  <div ref={v?.vizBodyRef} style={{"flex": "1", "minHeight": "0", "overflow": "auto", "position": "relative", "display": "flex", "flexDirection": "column"}}>
                    {v?.cur?.hasViz ? (<>
                      <div ref={v?.vizSvgRef} style={{"padding": "10px 16px 4px", "position": "relative", "overflowX": "auto", "flexShrink": "0", "display": "flex", "justifyContent": "center"}}>
                        {v?.vizSvg}
                      </div>
                      <div style={{"margin": "2px 14px 10px", "padding": "9px 12px", "borderRadius": "10px", "background": "#F7F7FD", "border": "1px solid #ECEBFB", "display": "flex", "flexDirection": "column", "gap": "2px", "position": "relative", "flexShrink": "0"}}>
                        <span style={{"fontSize": "11px", "color": "#7C7FF2", "fontWeight": "600", "display": "flex", "alignItems": "center", "gap": "6px"}}>
                          {v?.isQuote ? (<>
                            <svg width={"11"} height={"11"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"2.2"}>
                              <rect x={"9"} y={"3"} width={"6"} height={"11"} rx={"3"} />
                              <path d={"M5 11a7 7 0 0 0 14 0"} />
                            </svg>
                          </>) : (<>
                            <svg width={"11"} height={"11"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"2.2"}>
                              <path d={"M12 3l2.2 5.3L20 9l-4.4 3.8L17 18.5 12 15.6 7 18.5l1.4-5.7L4 9l5.8-.7z"} />
                            </svg>
                          </>)}
                          {v?.sayHead}
                        </span>
                        <span style={{"fontSize": "13px", "lineHeight": "1.55", "color": "#2E3038"}}>
                          {v?.isQuote ? "“" : ""}{v?.say}{v?.isQuote ? "”" : ""}
                        </span>
                      </div>
                      <div style={{"margin": "0 14px 10px", "padding": "12px", "border": "1px solid #ECEEF2", "borderRadius": "12px", "background": "#FCFCFD", "display": "flex", "flexDirection": "column", "gap": "10px", "position": "relative"}}>
                        <div style={{"display": "flex", "alignItems": "center", "justifyContent": "space-between", "gap": "8px"}}>
                          <span style={{"display": "flex", "alignItems": "center", "gap": "6px", "fontSize": "13px", "fontWeight": "600", "color": "#2E3038", "whiteSpace": "nowrap"}}>
                            <svg width={"14"} height={"14"} viewBox={"0 0 24 24"} fill={"none"} stroke={"#5B5FE8"} strokeWidth={"2"} strokeLinecap={"round"}>
                              <path d={"M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"} />
                              <circle cx={"16"} cy={"6"} r={"2"} />
                              <circle cx={"10"} cy={"12"} r={"2"} />
                              <circle cx={"18"} cy={"18"} r={"2"} />
                            </svg>
                            {"직접 조절해보기"}
                          </span>
                          <button onClick={v?.resetSim} style={{"height": "26px", "padding": "0 10px", "border": "1px solid #E8EAEE", "borderRadius": "7px", "background": "#FFFFFF", "color": "#4B4E58", "fontSize": "11px", "fontWeight": "500", "cursor": "pointer", "fontFamily": "inherit", "whiteSpace": "nowrap"}}>
                            {"기본값으로"}
                          </button>
                        </div>
                        <div style={{"padding": "9px 12px", "borderRadius": "10px", "background": v?.formulaBg, "border": `1px solid ${v?.formulaBorder ?? ""}`, "display": "flex", "flexDirection": "column", "gap": "4px"}}>
                          <span style={{"fontSize": "12px", "color": "#6E717C"}}>
                            {v?.formulaLabel}
                          </span>
                          <span style={{"fontSize": "19px", "fontWeight": "700", "letterSpacing": "-0.01em", "fontVariantNumeric": "tabular-nums", "color": v?.formulaColor}}>
                            {v?.formula}
                          </span>
                        </div>
                        <span style={{"fontSize": "13px", "lineHeight": "1.6", "color": "#4B4E58", "textWrap": "pretty", "padding": "0 2px", "marginTop": "-2px"}}>
                          {v?.explain}
                        </span>
                        <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(160px,1fr))", "gap": "14px 20px"}}>
                          {(v?.sliders || []).map((sl, sl_i) => (<React.Fragment key={sl_i}>
                            <div style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                              <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "baseline", "gap": "8px"}}>
                                <span style={{"fontSize": "12px", "fontWeight": "600", "color": "#4B4E58"}}>
                                  {sl?.label}
                                </span>
                                <span style={{"fontSize": "14px", "fontWeight": "700", "color": "#5B5FE8", "fontVariantNumeric": "tabular-nums"}}>
                                  {sl?.display}
                                </span>
                              </div>
                              <input type={"range"} min={sl?.min} max={sl?.max} step={sl?.step} value={sl?.value} onChange={sl?.onChange} style={{"width": "100%", "accentColor": "#5B6CF0", "cursor": "pointer", "margin": "0"}} />
                            </div>
                          </React.Fragment>))}
                        </div>
                      </div>
                    </>) : null}
                    {v?.noViz ? (<>
                      <div style={{"flex": "1", "display": "flex", "flexDirection": "column", "alignItems": "center", "justifyContent": "center", "gap": "8px", "padding": "32px", "textAlign": "center"}}>
                        <span style={{"fontSize": "14px", "fontWeight": "600", "color": "#4B4E58"}}>
                          {v?.emptyTitle}
                        </span>
                        <span style={{"fontSize": "12px", "color": "#9A9DA8", "lineHeight": "1.6"}}>
                          {"교수님 설명에 시간 순서가 있는 내용이 나오면"}
                          <br />
                          {"자동으로 도식이 만들어져요."}
                        </span>
                      </div>
                    </>) : null}
                  </div>
                  <div onPointerDown={v?.resize?.viz} title={"드래그해서 크기 조절"} style={{"position": "absolute", "right": "0", "bottom": "0", "width": "20px", "height": "20px", "cursor": "nwse-resize", "display": v?.ui?.handle, "alignItems": "flex-end", "justifyContent": "flex-end", "padding": "4px", "zIndex": "3", "touchAction": "none"}}>
                    <svg width={"10"} height={"10"} viewBox={"0 0 10 10"}>
                      <path d={"M9 1L1 9M9 5L5 9"} stroke={"#B4B7C0"} strokeWidth={"1.4"} strokeLinecap={"round"} />
                    </svg>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
      {v?.toast ? (<>
        <div style={{"position": "fixed", "left": "50%", "bottom": "36px", "zIndex": "1001", "transform": "translateX(-50%)", "background": "#1C1D22", "color": "#FFFFFF", "fontSize": "13px", "padding": "10px 16px", "borderRadius": "10px", "boxShadow": "0 10px 30px rgba(0,0,0,0.2)"}}>
          {v?.toast}
        </div>
      </>) : null}
      {v?.endOpen ? (<>
        <div onClick={v?.closeEnd} style={{"position": "fixed", "inset": "0", "zIndex": "1000", "background": "rgba(28,29,34,0.28)", "backdropFilter": "blur(3px)", "display": "flex", "alignItems": "center", "justifyContent": "center", "padding": "20px"}}>
          <div onClick={v?.stop} style={{"width": "100%", "maxWidth": "400px", "background": "#FFFFFF", "borderRadius": "18px", "padding": "22px", "display": "flex", "flexDirection": "column", "gap": "18px", "boxShadow": "0 24px 60px -12px rgba(40,30,120,0.25)"}}>
            <div style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
              <span style={{"fontSize": "18px", "fontWeight": "700"}}>
                {v?.endTitle}
              </span>
              <span style={{"fontSize": "13px", "lineHeight": "1.6", "color": "#6E717C"}}>
                {"지금 종료하면 이번 수업의 받아쓰기·요약·시각화 기록이 사라져요. 로그인 없이 사용 중이라 노트는 이 기기에 파일로만 저장할 수 있어요."}
              </span>
            </div>
            <div style={{"display": "flex", "flexDirection": "column", "gap": "8px"}}>
              <button onClick={v?.saveAndEnd} style={{"height": "42px", "border": "none", "borderRadius": "11px", "background": "#1C1D22", "color": "#FFFFFF", "fontSize": "14px", "fontWeight": "600", "cursor": "pointer"}}>
                {v?.endSaveLabel}
              </button>
              <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "8px"}}>
                <button onClick={v?.closeEnd} style={{"height": "40px", "border": "1px solid #E3E5EA", "borderRadius": "11px", "background": "#FFFFFF", "color": "#2E3038", "fontSize": "13px", "fontWeight": "600", "cursor": "pointer"}}>
                  {"계속 듣기"}
                </button>
                <button onClick={v?.endNoSave} style={{"height": "40px", "border": "1px solid #F3D0D1", "borderRadius": "11px", "background": "#FFFFFF", "color": "#D2383E", "fontSize": "13px", "fontWeight": "600", "cursor": "pointer"}}>
                  {"저장 없이 종료"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>) : null}
    </div>
    </>
  );
}
