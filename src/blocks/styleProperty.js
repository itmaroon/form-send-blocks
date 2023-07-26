
// sideの最初の文字を大文字にする関数
const capitalizeFirstLetter = string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function borderProperty(borderObj) {
  if (borderObj) {//borderObjがundefinedでない
    let keys = ['top', 'bottom', 'left', 'right'];
    let ret_prop = null;
    let doesKeyExist = keys.some(key => key in borderObj);
    if (doesKeyExist) {//'top', 'bottom', 'left', 'right'が別設定
      let cssObj = {};
      for (let side in borderObj) {
        const sideData = borderObj[side];
        const startsWithZero = String(sideData.width || '').match(/^0/);
        if (startsWithZero) {//widthが０ならCSS設定しない
          continue;
        }
        const border_style = sideData.style || 'solid';
        let camelCaseSide = `border${capitalizeFirstLetter(side)}`;
        cssObj[camelCaseSide] = `${sideData.width} ${border_style} ${sideData.color}`;
      }
      ret_prop = cssObj;
      return ret_prop;
    } else {//同一のボーダー
      const startsWithZero = String(borderObj.width || '').match(/^0/);
      if (startsWithZero) {//widthが０ならnullを返す
        return null;
      }
      const border_style = borderObj.style || 'solid';
      ret_prop = { border: `${borderObj.width} ${border_style} ${borderObj.color}` }

      return ret_prop;
    }
  } else {
    return null;
  }

}

//角丸の設定
export function radiusProperty(radiusObj) {
  const ret_prop = (radiusObj && Object.keys(radiusObj).length === 1)
    ? radiusObj.value :
    `${(radiusObj && radiusObj.topLeft) || ''} ${(radiusObj && radiusObj.topRight) || ''} ${(radiusObj && radiusObj.bottomRight) || ''} ${(radiusObj && radiusObj.bottomLeft) || ''}`
  const ret_val = { borderRadius: ret_prop };
  return ret_val;
}

//マージンの設定
export function marginProperty(marginObj) {
  const ret_prop = `${marginObj.top} ${marginObj.right} ${marginObj.bottom} ${marginObj.left}`

  const ret_val = { margin: ret_prop };
  return ret_val;
}
//パディングの設定
export function paddingProperty(paddingObj) {
  const ret_prop = `${paddingObj.top} ${paddingObj.right} ${paddingObj.bottom} ${paddingObj.left}`

  const ret_val = { padding: ret_prop };
  return ret_val;
}
