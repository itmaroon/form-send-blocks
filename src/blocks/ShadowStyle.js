
import { __ } from '@wordpress/i18n';
import {
  __experimentalPanelColorGradientSettings as PanelColorGradientSettings,
} from '@wordpress/block-editor';
import {
  PanelBody,
  PanelRow,
  ToggleControl,
  RangeControl,
  RadioControl
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { dispatch } from '@wordpress/data';
import { hslToRgb16, HexToRGB, rgb16ToHsl } from './hslToRgb';

//方向と距離
const dirctionDigit = (direction, distance) => {
  let destTopLeft, destTopRight, destBottomLeft, destBottomRight;
  switch (direction) {
    case "top_left":
      destTopLeft = distance;
      destTopRight = distance;
      destBottomLeft = distance * -1;
      destBottomRight = distance * -1;
      break;
    case "top_right":
      destTopLeft = distance * -1;
      destTopRight = distance;
      destBottomLeft = distance;
      destBottomRight = distance * -1;
      break;
    case "bottom_left":
      destTopLeft = distance;
      destTopRight = distance * -1;
      destBottomLeft = distance * -1;
      destBottomRight = distance;
      break;
    case "bottom_right":
      destTopLeft = distance * -1;
      destTopRight = distance * -1;
      destBottomLeft = distance;
      destBottomRight = distance;
      break;
    case "right_bottom":
      destTopLeft = distance;
      destTopRight = distance * -1;
      destBottomLeft = distance * -1;
      destBottomRight = distance;
      break;
    case "top":
      destTopLeft = 0;
      destTopRight = 0;
      destBottomLeft = distance * -1;
      destBottomRight = distance;
      break;
  }
  return (
    {
      topLeft: destTopLeft,
      topRight: destTopRight,
      bottomLeft: destBottomLeft,
      bottmRight: destBottomRight
    }
  )
}

// グラデーションの色値は通常'linear-gradient'または'radial-gradient'で始まるので、
// これらのキーワードを探すことでグラデーションかどうかを判断します。
function isGradient(colorValue) {
  return colorValue.includes('linear-gradient') || colorValue.includes('radial-gradient');
}


export const ShadowElm = (shadowState) => {
  //let baseColor;
  const {
    shadowType,
    spread,
    lateral,
    longitude,
    nomalBlur,
    shadowColor,
    blur,
    intensity,
    distance,
    newDirection,
    clayDirection,
    embos,
    opacity,
    depth,
    bdBlur,
    expand,
    glassblur,
    glassopa,
    hasOutline,
    baseColor
  } = shadowState;

  //ノーマル
  if (shadowType === 'nomal') {
    //boxshadowの生成
    const ShadowStyle = embos === 'dent' ? {
      style: {
        boxShadow: `${lateral}px ${longitude}px ${nomalBlur}px ${spread}px transparent, inset ${lateral}px ${longitude}px ${nomalBlur}px ${spread}px ${shadowColor}`
      }
    } : {
      style: {
        boxShadow: `${lateral}px ${longitude}px ${nomalBlur}px ${spread}px ${shadowColor}, inset ${lateral}px ${longitude}px ${nomalBlur}px ${spread}px transparent`
      }
    }
    //Shadowのスタイルを返す
    return ShadowStyle;
  }
  //ニューモフィズム
  else if (shadowType === 'newmor') {

    //背景がグラデーションのときはセットしない
    if (isGradient(baseColor)) {
      dispatch('core/notices').createNotice(
        'error',
        __('Neumorphism cannot be set when the background color is a gradient. ', 'itmar_guest_contact_block'),
        { type: 'snackbar', isDismissible: true, }
      );
      return null;
    }
    //ボタン背景色のHSL値
    const hslValue = rgb16ToHsl(baseColor);
    //影の明るさを変更
    const lightVal = (hslValue.lightness + intensity) < 100 ? hslValue.lightness + intensity : 100;
    const darkVal = (hslValue.lightness - intensity) > 0 ? hslValue.lightness - intensity : 0;
    const lightValue = hslToRgb16(hslValue.hue, hslValue.saturation, lightVal);
    const darkValue = hslToRgb16(hslValue.hue, hslValue.saturation, darkVal);
    //boxshadowの生成
    //立体の方向
    const dircObj = dirctionDigit(newDirection, distance);

    const baseStyle = {
      style: {
        border: 'none',
        background: baseColor
      }
    }

    const newmorStyle = embos === 'swell' ? {
      style: {
        ...baseStyle.style,
        boxShadow: `${dircObj.topLeft}px ${dircObj.topRight}px ${blur}px ${darkValue}, ${dircObj.bottomLeft}px ${dircObj.bottmRight}px ${blur}px ${lightValue}, inset ${dircObj.topLeft}px ${dircObj.topRight}px ${blur}px transparent, inset ${dircObj.bottomLeft}px ${dircObj.bottmRight}px ${blur}px transparent`
      }
    } : {
      style: {
        ...baseStyle.style,
        boxShadow: `${dircObj.topLeft}px ${dircObj.topRight}px ${blur}px transparent, ${dircObj.bottomLeft}px ${dircObj.bottmRight}px ${blur}px transparent, inset ${dircObj.topLeft}px ${dircObj.topRight}px ${blur}px ${darkValue}, inset ${dircObj.bottomLeft}px ${dircObj.bottmRight}px ${blur}px ${lightValue}`
      }
    }

    //Shadowのスタイルを返す
    return newmorStyle;
  }

  //クレイモーフィズム
  else if (shadowType === 'claymor') {
    //背景がグラデーションのときはセットしない
    if (isGradient(baseColor)) {
      dispatch('core/notices').createNotice(
        'error',
        __('claymorphism cannot be set when the background color is a gradient. ', 'itmar_guest_contact_block'),
        { type: 'snackbar', isDismissible: true, }
      );
      return null;
    }
    const rgbValue = HexToRGB(baseColor)
    const outsetObj = dirctionDigit(clayDirection, expand)
    const insetObj = dirctionDigit(clayDirection, depth)
    const baseStyle = {
      style: {
        background: `rgba(255, 255, 255, ${opacity})`,
        backdropFilter: `blur(${bdBlur}px)`,
        border: 'none',
      }
    }
    const claymorStyle = {
      ...baseStyle,
      style: {
        ...baseStyle.style,
        boxShadow: `${outsetObj.topLeft}px ${outsetObj.bottmRight}px ${expand * 2}px 0px rgba(${rgbValue.red}, ${rgbValue.green}, ${rgbValue.blue}, 0.5), inset ${insetObj.topRight}px ${insetObj.bottomLeft}px 16px 0px rgba(${rgbValue.red}, ${rgbValue.green}, ${rgbValue.blue}, 0.6), inset 0px 11px 28px 0px rgb(255, 255, 255)`,
      }
    }
    //attributesに保存
    return claymorStyle;
  }

  //グラスモーフィズム
  else if (shadowType === 'glassmor') {

    const baseStyle = {
      style: {
        backgroundColor: `rgba(255, 255, 255, ${glassopa})`,
        ...hasOutline ? { border: `1px solid rgba(255, 255, 255, 0.4)` } : {},
        borderRightColor: `rgba(255, 255, 255, 0.2)`,
        borderBottomColor: `rgba(255, 255, 255, 0.2)`,
        backdropFilter: `blur( ${glassblur}px )`
      }
    }
    const glassmorStyle = embos === 'swell' ? {
      ...baseStyle,
      style: {
        ...baseStyle.style,
        boxShadow: `0 8px 12px 0 rgba( 31, 38, 135, 0.37 ), inset 0 8px 12px 0 transparent`
      }
    } : {
      ...baseStyle,
      style: {
        ...baseStyle.style,
        boxShadow: `0 8px 12px 0 transparent, inset 0 8px 12px 0 rgba( 31, 38, 135, 0.37 )`

      }
    }

    //attributesに保存
    return glassmorStyle;
  }
}

const ShadowStyle = ({ shadowStyle, onChange }) => {
  const [shadowState, setShadowState] = useState(shadowStyle);

  const {
    shadowType,
    spread,
    lateral,
    longitude,
    nomalBlur,
    shadowColor,
    blur,
    intensity,
    distance,
    newDirection,
    clayDirection,
    embos,
    opacity,
    depth,
    bdBlur,
    expand,
    glassblur,
    glassopa,
    hasOutline
  } = shadowState;

  //シャドーのスタイル変更と背景色変更に伴う親コンポーネントの変更
  useEffect(() => {
    const shadowElm = ShadowElm(shadowState);
    if (shadowElm) onChange(shadowElm, shadowState)
  }, [shadowState]);

  return (
    <>
      <PanelBody title={__("Shadow Type", 'itmar_block_collections')} initialOpen={true}>
        <div className="itmar_shadow_type">
          <RadioControl
            selected={shadowType}
            options={[
              { label: __("Nomal", 'itmar_block_collections'), value: 'nomal' },
              { label: __("Neumorphism", 'itmar_block_collections'), value: 'newmor' },
              { label: __("Claymorphism", 'itmar_block_collections'), value: 'claymor' },
              { label: __("Grassmophism", 'itmar_block_collections'), value: 'glassmor' },
            ]}
            onChange={(changeOption) => setShadowState({ ...shadowState, shadowType: changeOption })}
          />
        </div>
        {(shadowType !== 'claymor') &&
          <div className="embos">
            <RadioControl
              label={__("unevenness", 'itmar_block_collections')}
              selected={embos}
              options={[
                { value: 'swell' },
                { value: 'dent' },

              ]}
              onChange={(changeOption) => setShadowState({ ...shadowState, embos: changeOption })}
            />
          </div>
        }
      </PanelBody>

      {shadowType === 'nomal' &&
        <PanelBody title={__("Nomal settings", 'itmar_block_collections')} initialOpen={false}>
          <RangeControl
            value={spread}
            label={__("Spread", 'itmar_block_collections')}
            max={50}
            min={0}
            onChange={(val) => setShadowState({ ...shadowState, spread: val })}
            withInputField={false}
          />
          <RangeControl
            value={lateral}
            label={__("Lateral direction", 'itmar_block_collections')}
            max={50}
            min={0}
            onChange={(val) => setShadowState({ ...shadowState, lateral: val })}
            withInputField={false}
          />
          <RangeControl
            value={longitude}
            label={__("Longitudinal direction", 'itmar_block_collections')}
            max={50}
            min={0}
            onChange={(val) => setShadowState({ ...shadowState, longitude: val })}
            withInputField={false}
          />
          <RangeControl
            value={nomalBlur}
            label={__("Blur", 'itmar_block_collections')}
            max={20}
            min={0}
            onChange={(val) => setShadowState({ ...shadowState, nomalBlur: val })}
            withInputField={false}
          />
          <PanelColorGradientSettings
            title={__("Shadow Color Setting", 'itmar_block_collections')}
            settings={[
              {
                colorValue: shadowColor,
                label: __("Choose Shadow color", 'itmar_block_collections'),
                onColorChange: (newValue) => setShadowState({ ...shadowState, shadowColor: newValue }),
              },
            ]}
          />

        </PanelBody>
      }

      {shadowType === 'newmor' &&
        <PanelBody title={__("Neumorphism settings", 'itmar_block_collections')} initialOpen={false}>
          <RangeControl
            value={distance}
            label={__("Distance", 'itmar_block_collections')}
            max={50}
            min={0}
            onChange={(val) => setShadowState({ ...shadowState, distance: val })}
            withInputField={false}
          />
          <RangeControl
            value={intensity}
            label={__("Intensity", 'itmar_block_collections')}
            max={100}
            min={0}
            onChange={(val) => setShadowState({ ...shadowState, intensity: val })}
            withInputField={false}
          />
          <RangeControl
            value={blur}
            label={__("Blur", 'itmar_block_collections')}
            max={20}
            min={0}
            onChange={(val) => setShadowState({ ...shadowState, blur: val })}
            withInputField={false}
          />
          <PanelRow>
            <div className="light_direction">
              <RadioControl
                selected={newDirection}
                options={[
                  { value: 'top_left' },
                  { value: 'top_right' },
                  { value: 'bottom_left' },
                  { value: 'bottom_right' },
                ]}
                onChange={(changeOption) => setShadowState({ ...shadowState, newDirection: changeOption })}
              />
            </div>

          </PanelRow>

        </PanelBody>

      }
      {shadowType === 'claymor' &&

        <PanelBody title={__("Claymorphism settings", 'itmar_block_collections')} initialOpen={false}>
          <RangeControl
            value={opacity}
            label={__("Opacity", 'itmar_block_collections')}
            max={1}
            min={0}
            step={.1}
            onChange={(val) => setShadowState({ ...shadowState, opacity: val })}
            withInputField={false}
          />
          <RangeControl
            value={depth}
            label="Depth"
            max={20}
            min={0}
            onChange={(val) => setShadowState({ ...shadowState, depth: val })}
            withInputField={false}
          />
          <RangeControl
            value={expand}
            label="Expand"
            max={50}
            min={0}
            onChange={(val) => setShadowState({ ...shadowState, expand: val })}
            withInputField={false}
          />
          <RangeControl
            value={bdBlur}
            label="Background Blur"
            max={10}
            min={0}
            onChange={(val) => setShadowState({ ...shadowState, bdBlur: val })}
            withInputField={false}
          />
          <div className="light_direction claymor">
            <RadioControl
              selected={clayDirection}
              options={[
                { value: 'right_bottom' },
                { value: 'top_right' },
                { value: 'top' },
              ]}
              onChange={(changeOption) => setShadowState({ ...shadowState, clayDirection: changeOption })}
            />
          </div>
        </PanelBody>
      }

      {shadowType === 'glassmor' &&
        <PanelBody title={__("Grassmophism settings", 'itmar_block_collections')} initialOpen={false}>
          <RangeControl
            value={glassblur}
            label={__("Glass blur", 'itmar_block_collections')}
            max={20}
            min={0}
            onChange={(val) => setShadowState({ ...shadowState, glassblur: val })}
            withInputField={false}
          />
          <RangeControl
            value={glassopa}
            label={__("Glass Opacity", 'itmar_block_collections')}
            max={1}
            min={0}
            step={.1}
            onChange={(val) => setShadowState({ ...shadowState, glassopa: val })}
            withInputField={false}
          />
          <fieldset>
            <ToggleControl
              label={__("Show outline", 'itmar_block_collections')}
              checked={hasOutline}
              onChange={() => setShadowState({ ...shadowState, hasOutline: !hasOutline })}
            />
          </fieldset>
        </PanelBody>
      }
    </>

  );
};
export default ShadowStyle;

