import React from 'react';

// 디자인 단계의 DC 로직 클래스를 그대로 쓰기 위한 얇은 래퍼: renderVals() 결과를 View에 넘겨 렌더링
export class DCLogic extends React.Component {
  render() {
    return this.constructor.View(this.renderVals());
  }
}
