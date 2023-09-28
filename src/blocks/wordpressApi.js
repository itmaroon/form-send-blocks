import { withSelect } from '@wordpress/data';
import { ComboboxControl } from '@wordpress/components';

export const RedirectSelectControl = withSelect((select) => {
  const pages = select('core').getEntityRecords('postType', 'page');
  if (pages && !pages.some(page => page.id === -1)) {
    // ホームページ用の選択肢を追加します。
    pages.unshift({ id: -1, title: { rendered: 'ホーム' }, link: '/' });
  }
  return { pages }

})(function ({ pages, setAttributes, attributes }) {
  const { selectedPageId, selectedPageUrl } = attributes;
  // 選択肢が選択されたときの処理です。
  const handleChange = (selectedId) => {
    const selectedPage = pages.find(page => page.id === selectedId);
    setAttributes({
      selectedPageId: selectedId,
      selectedPageUrl: selectedPage ? selectedPage.link : '/'
    });
  };
  // 選択肢を作成します。
  const options = pages ? pages.map(page => ({
    value: page.id,
    label: page.title.rendered
  })) : [];


  return (
    <ComboboxControl
      label="リダイレクト先を選択"
      options={options}
      value={selectedPageId}
      onChange={handleChange}
    />
  );
});