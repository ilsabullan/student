import React from 'react';

export default function OnboardingView(v) {
  return (
    <>
    <div style={{"minHeight": "100vh", "padding": "20px", "display": "flex"}}>
      <div style={{"flex": "1", "display": "flex", "gap": "12px", "background": "#F6F7F9", "border": "1px solid #E3E5EA", "borderRadius": "22px", "padding": "12px", "minHeight": "calc(100vh - 40px)"}}>
        <main style={{"flex": "1", "minWidth": "0", "background": "#FBFBFC", "border": "1px solid #ECEEF2", "borderRadius": "16px", "display": "flex", "flexDirection": "column", "position": "relative", "overflow": "hidden"}}>
          <div style={{"position": "absolute", "left": "50%", "top": "58%", "width": "720px", "height": "420px", "transform": "translate(-50%,-50%)", "background": "radial-gradient(ellipse at center, rgba(150,140,250,0.16), rgba(150,140,250,0) 65%)", "pointerEvents": "none"}} />
          <header style={{"display": "flex", "alignItems": "center", "justifyContent": "space-between", "padding": "16px 20px", "position": "relative"}}>
            <div style={{"display": "flex", "alignItems": "center", "gap": "14px", "minWidth": "0"}}>
        <div style={{"display": "flex", "alignItems": "center", "gap": "8px"}}>
        <div style={{"width": "45px", "height": "30px", "flexShrink": "0", "display": "flex", "alignItems": "center", "justifyContent": "center"}}>
          <img src={"/logo-mark.png"} alt={"Visync"} style={{"width": "100%", "height": "100%", "objectFit": "contain"}} />
        </div>
        <span style={{"fontSize": "17px", "fontWeight": "700", "letterSpacing": "-0.02em"}}>{"Visync"}</span>
        </div>
        <div style={{"display": "flex", "alignItems": "center", "gap": "8px", "height": "34px", "padding": "0 12px", "border": "1px solid #E8EAEE", "borderRadius": "10px", "background": "#FFFFFF", "fontSize": "13px", "fontWeight": "600", "color": "#2E3038", "whiteSpace": "nowrap", "flexShrink": "0"}}>
              <span style={{"width": "8px", "height": "8px", "borderRadius": "50%", "background": "#7C7FF2"}} />
              {"학생 모드"}
            </div>
        </div>
            <button onClick={v?.askMic} title={v?.micTitle} style={{"display": "flex", "alignItems": "center", "gap": "8px", "fontSize": "12px", "color": v?.micColor, "border": "none", "background": "transparent", "padding": "6px 4px", "fontFamily": "inherit", "cursor": v?.micCursor, "whiteSpace": "nowrap"}}>
              <span style={{"width": "6px", "height": "6px", "borderRadius": "50%", "background": v?.micDot}} />
              {v?.micLabel}
            </button>
          </header>
          <div style={{"flex": "1", "display": "flex", "flexDirection": "column", "alignItems": "center", "justifyContent": "center", "padding": "24px 24px 64px", "gap": "36px", "position": "relative"}}>
            <div style={{"display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "18px", "textAlign": "center"}}>
              <div style={{"width": "100px", "height": "92px", "animation": "vsFloat 3.2s ease-in-out infinite"}}>
                <img src={"/logo.png"} alt={""} style={{"width": "100%", "height": "100%", "objectFit": "contain"}} />
              </div>
              <h1 style={{"margin": "0", "fontSize": "clamp(24px,3vw,32px)", "lineHeight": "1.35", "fontWeight": "700", "letterSpacing": "-0.025em", "textWrap": "balance"}}>
                {"오늘은 "}
                <span style={{"background": "linear-gradient(90deg,#8C6CF0,#5B6CF0)", "WebkitBackgroundClip": "text", "backgroundClip": "text", "color": "transparent"}}>
                  {"어떤 수업"}
                </span>
                {"을 들으시나요?"}
              </h1>
              <p style={{"margin": "0", "fontSize": "15px", "color": "#6E717C", "lineHeight": "1.6", "textWrap": "pretty"}}>
                {"강의 자료를 올려주시면 목차를 기준으로 챕터를 나누고,"}
                <br />
                {"교수님 설명에 맞춰 흐름이 있는 내용을 움직이는 도식으로 보여드려요."}
              </p>
            </div>
            <div style={{"width": "100%", "maxWidth": "620px", "background": "#FFFFFF", "border": "1px solid #E8EAF0", "borderRadius": "18px", "boxShadow": "0 1px 2px rgba(20,20,40,0.04), 0 18px 48px -12px rgba(90,80,200,0.14)", "padding": "14px", "display": "flex", "flexDirection": "column", "gap": "12px"}}>
              {v?.isIdle ? (<>
                <div onClick={v?.pick} onDragOver={v?.onDragOver} onDragLeave={v?.onDragLeave} onDrop={v?.onDrop} style={{"display": "flex", "flexDirection": "column", "alignItems": "center", "justifyContent": "center", "gap": "12px", "minHeight": "200px", "border": `1.5px dashed ${v?.dropBorder ?? ""}`, "background": v?.dropBg, "borderRadius": "12px", "cursor": "pointer", "padding": "24px", "textAlign": "center", "transition": "all .15s"}}>
                  <div style={{"width": "48px", "height": "48px", "borderRadius": "14px", "background": "#F1F1FE", "color": "#5B5FE8", "display": "flex", "alignItems": "center", "justifyContent": "center"}}>
                    <svg width={"22"} height={"22"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.8"} strokeLinecap={"round"} strokeLinejoin={"round"}>
                      <path d={"M12 16V4M7 9l5-5 5 5"} />
                      <path d={"M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"} />
                    </svg>
                  </div>
                  <div style={{"display": "flex", "flexDirection": "column", "gap": "4px"}}>
                    <span style={{"fontSize": "15px", "fontWeight": "600", "color": "#2E3038"}}>
                      {"강의 자료 PDF를 끌어다 놓거나 "}
                      <span style={{"color": "#5B5FE8"}}>
                        {"파일 선택"}
                      </span>
                    </span>
                    <span style={{"fontSize": "12px", "color": "#9A9DA8"}}>
                      {"PDF · 최대 100MB"}
                    </span>
                  </div>
                </div>
              </>) : null}
              {v?.hasFile ? (<>
                <div style={{"display": "flex", "alignItems": "center", "gap": "12px", "padding": "12px", "border": "1px solid #ECEEF2", "borderRadius": "12px", "background": "#FAFAFC"}}>
                  <div style={{"width": "40px", "height": "48px", "borderRadius": "6px", "background": "#FFFFFF", "border": "1px solid #E6E7EC", "display": "flex", "alignItems": "flex-end", "justifyContent": "center", "paddingBottom": "6px", "fontSize": "9px", "fontWeight": "700", "color": "#E5484D", "flexShrink": "0"}}>
                    {"PDF"}
                  </div>
                  <div style={{"flex": "1", "minWidth": "0", "display": "flex", "flexDirection": "column", "gap": "6px"}}>
                    <div style={{"display": "flex", "justifyContent": "space-between", "gap": "12px"}}>
                      <span style={{"fontSize": "14px", "fontWeight": "600", "whiteSpace": "nowrap", "overflow": "hidden", "textOverflow": "ellipsis"}}>
                        {v?.fileName}
                      </span>
                      <span style={{"fontSize": "12px", "color": "#9A9DA8", "flexShrink": "0"}}>
                        {v?.fileSize}
                      </span>
                    </div>
                    {v?.isLoading ? (<>
                      <div style={{"display": "flex", "flexDirection": "column", "gap": "6px"}}>
                        <div style={{"height": "4px", "borderRadius": "4px", "background": "#ECECF6", "overflow": "hidden"}}>
                          <div style={{"height": "100%", "width": v?.progressPct, "background": "linear-gradient(90deg,#9B7CF4,#5B6CF0)", "borderRadius": "4px", "transition": "width .2s"}} />
                        </div>
                        <span style={{"fontSize": "12px", "color": "#7C7FF2"}}>
                          {v?.stepLabel}
                        </span>
                      </div>
                    </>) : null}
                    {v?.isReady ? (<>
                      <span style={{"fontSize": "12px", "color": "#2FA876", "display": "flex", "alignItems": "center", "gap": "4px"}}>
                        <svg width={"12"} height={"12"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"3"}>
                          <path d={"m5 12 5 5 9-10"} />
                        </svg>
                        {"분석 완료 · "}{v?.pageCount}{"페이지 · 챕터 "}{v?.chapterCount}
                      </span>
                    </>) : null}
                  </div>
                  <button onClick={v?.reset} title={"삭제"} style={{"width": "30px", "height": "30px", "border": "none", "background": "transparent", "borderRadius": "8px", "color": "#9A9DA8", "cursor": "pointer", "display": "flex", "alignItems": "center", "justifyContent": "center", "flexShrink": "0"}}>
                    <svg width={"14"} height={"14"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"2"}>
                      <path d={"M6 6l12 12M18 6 6 18"} />
                    </svg>
                  </button>
                </div>
              </>) : null}
              {v?.isReady ? (<>
                <div style={{"display": "flex", "flexDirection": "column", "gap": "8px", "padding": "4px 4px 0"}}>
                  <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "baseline"}}>
                    <span style={{"fontSize": "13px", "fontWeight": "600", "color": "#2E3038"}}>
                      {"강의 챕터"}
                    </span>
                    <span style={{"fontSize": "12px", "color": "#9A9DA8"}}>
                      {"자료 목차 기준"}
                    </span>
                  </div>
                  <div style={{"display": "flex", "flexDirection": "column", "border": "1px solid #ECEEF2", "borderRadius": "12px", "overflow": "hidden"}}>
                    {(v?.chapters || []).map((c, c_i) => (<React.Fragment key={c_i}>
                      <div style={{"display": "grid", "gridTemplateColumns": "28px minmax(0,1fr) auto", "alignItems": "center", "gap": "10px", "padding": "10px 12px", "borderTop": `1px solid ${c?.border ?? ""}`, "fontSize": "13px"}}>
                        <span style={{"fontSize": "12px", "color": "#A0A3AD", "fontVariantNumeric": "tabular-nums"}}>
                          {c?.no}
                        </span>
                        <span style={{"color": "#2E3038", "whiteSpace": "nowrap", "overflow": "hidden", "textOverflow": "ellipsis"}}>
                          {c?.title}
                        </span>
                        <span style={{"fontSize": "11px", "color": c?.tagColor, "background": c?.tagBg, "padding": "3px 8px", "borderRadius": "6px"}}>
                          {c?.tag}
                        </span>
                      </div>
                    </React.Fragment>))}
                  </div>
                </div>
              </>) : null}
              <div style={{"display": "flex", "alignItems": "center", "gap": "8px", "flexWrap": "wrap"}}>
                <span style={{"fontSize": "12px", "color": "#6E717C", "marginLeft": "4px"}}>
                  {"강의 언어"}
                </span>
                <div role={"group"} aria-label={"강의 언어"} style={{"display": "flex", "padding": "3px", "background": "#F2F3F6", "borderRadius": "9px", "gap": "2px"}}>
                  {(v?.langs || []).map((lg, lg_i) => (<React.Fragment key={lg_i}>
                    <button onClick={lg?.go} style={{"height": "26px", "padding": "0 10px", "border": "none", "borderRadius": "7px", "background": lg?.bg, "color": lg?.color, "boxShadow": lg?.shadow, "fontSize": "12px", "fontWeight": lg?.weight, "cursor": "pointer", "fontFamily": "inherit", "whiteSpace": "nowrap"}}>
                      {lg?.label}
                    </button>
                  </React.Fragment>))}
                </div>
                <button onClick={v?.start} disabled={v?.notReady} style={{"marginLeft": "auto", "display": "flex", "alignItems": "center", "gap": "6px", "height": "36px", "padding": "0 16px", "border": "none", "borderRadius": "10px", "background": v?.startBg, "color": v?.startColor, "fontSize": "13px", "fontWeight": "600", "cursor": v?.startCursor, "transition": "background .15s"}}>
                  {v?.startLabel}
                  <svg width={"14"} height={"14"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"2.2"}>
                    <path d={"M5 12h14M13 6l6 6-6 6"} />
                  </svg>
                </button>
              </div>
              <input type={"file"} accept={"application/pdf"} ref={v?.fileRef} onChange={v?.onFile} style={{"display": "none"}} />
            </div>
            
          </div>
        </main>
      </div>
    </div>
    </>
  );
}
