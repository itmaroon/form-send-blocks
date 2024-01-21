import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import {
  Button,
  PanelBody,
  PanelRow,
  __experimentalUnitControl as UnitControl
} from '@wordpress/components';

export const useDraggingMove = (isMovable, blockRef, position, onPositionChange) => {
  const elmposition = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const mousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const element = blockRef.current;

    if (!isMovable) {
      if (element) {
        element.classList.remove('itmar_isDraggable');//移動カーソル表示クラス削除
      }
      return; // 移動許可がある場合のみ、後続のロジックを実行
    }
    //positionの変化に合わせて現在位置を変更
    const pos_value_x = position.x.match(/(-?\d+)([a-zA-Z]+)/);
    const pos_value_y = position.y.match(/(-?\d+)([a-zA-Z]+)/);
    elmposition.current = { x: parseInt(pos_value_x[1]), y: parseInt(pos_value_y[1]) }

    //イベントハンドラ
    const handleMouseDown = (event) => {
      // 移動カーソル表示クラス名を追加します。
      element.classList.add('itmar_isDraggable');
      //ドラッグの開始フラグオン
      isDragging.current = true;
      //ドラッグ開始の絶対位置
      mousePosition.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseMove = (event) => {
      if (!isDragging.current) return;//ドラッグ中でなければ処理を中止
      const dx = event.clientX - mousePosition.current.x;
      const dy = event.clientY - mousePosition.current.y;
      //ドラッグ後の位置を保存
      const newPosition = {
        x: elmposition.current.x + dx,
        y: elmposition.current.y + dy,
      };
      elmposition.current = newPosition;
      mousePosition.current = { x: event.clientX, y: event.clientY };//マウス位置の保存
      //ドラッグによるブロックの一時的移動
      element.style.transform = `translate(${elmposition.current.x}px, ${elmposition.current.y}px)`;
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      element.style.transform = null;
      //呼出しもとに要素の位置を返す
      onPositionChange({ x: `${elmposition.current.x}px`, y: `${elmposition.current.y}px` });
    };
    const handleMouseLeave = () => {
      isDragging.current = false;
    };

    if (element) {
      // クラス名を追加します。
      element.classList.add('itmar_isDraggable');
    }
    // イベントハンドラを追加します。
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseLeave);

    // イベントリスナーを削除するクリーンアップ関数を返します。
    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.style.transform = null;
    };
  }, [isMovable, blockRef, position, onPositionChange]); // 依存配列に isMovable を含めます
}

export default function DraggableBox(props) {

  const position = props.attributes

  //インスペクター内のコントロールからの移動操作
  const chagePosition = (value, cordinate) => {
    if (value) {
      const newPos = { ...position, [cordinate]: value };
      props.onPositionChange(newPos);
    }
  }

  //リセット
  const resetPos = () => {
    const newPos = { "x": "0px", "y": "0px" };
    props.onPositionChange(newPos);
  }

  return (
    <>
      <PanelBody
        title={__("Position Setting", 'itmar_block_collections')}
        initialOpen={true}
      >
        <PanelRow
          className='distance_row'
        >
          <UnitControl
            dragDirection="e"
            onChange={(value) => chagePosition(value, 'x')}
            label={__("Lateral direction", 'itmar_block_collections')}
            value={position?.x || 0}
          />
          <UnitControl
            dragDirection="e"
            onChange={(value) => chagePosition(value, 'y')}
            label={__("Longitudinal direction", 'itmar_block_collections')}
            value={position?.y || 0}
          />
        </PanelRow>
        <PanelRow
          className='reset_row'
        >
          <Button
            variant="secondary"
            onClick={() => resetPos()}
          >
            {__("Reset", 'itmar_block_collections')}
          </Button>
        </PanelRow>
      </PanelBody>
    </>
  )
}