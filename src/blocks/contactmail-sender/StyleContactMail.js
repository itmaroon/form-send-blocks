
import styled, { css } from 'styled-components';
import { space_prm, convertToScss } from '../cssPropertes';

export const StyleComp = ({ attributes, children }) => {
  return (
    < StyledDiv attributes={attributes} >
      {children}
    </StyledDiv >
  );
}

const StyledDiv = styled.div`
  ${({ attributes }) => {

    const {
      default_pos,
      mobile_pos,
      shadow_result,
      is_shadow,
    } = attributes;


    //スペースの設定
    const default_margin_prm = space_prm(default_pos.margin_value);
    const default_padding_prm = space_prm(default_pos.padding_value);
    const mobile_margin_prm = space_prm(mobile_pos.margin_value);
    const mobile_padding_prm = space_prm(mobile_pos.padding_value);

    //ボックスシャドーの設定
    const box_shadow_style = is_shadow && shadow_result ? convertToScss(shadow_result) : ''

    // 共通のスタイルをここで定義します
    const commonStyle = css`
      position: relative;
      margin: ${default_margin_prm};
      padding: ${default_padding_prm};
      
      ${box_shadow_style};
      @media (max-width: 767px) {
        margin: ${mobile_margin_prm};
        padding: ${mobile_padding_prm};
      }
    }  
    `;



    // 共通のスタイルを組み合わせて返します
    return css`
      ${commonStyle}
    `;
  }}
`;





