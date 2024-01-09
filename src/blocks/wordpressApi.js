import { useState, useEffect } from '@wordpress/element';
import { ComboboxControl } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

//コントロールのレンダリング関数
const SelectControl = ({ setAttributes, attributes, label, homeUrl, fetchOptions }) => {
  const { selectedPageId } = attributes;
  const [options, setOptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedOptions = await fetchOptions(homeUrl);
        setOptions(fetchedOptions);
      } catch (error) {
        console.error('Error fetching data:', error.message);
      }
    };

    fetchData();
  }, [fetchOptions]);

  const handleChange = (selectedId) => {
    const selectedPage = options.find(page => page.value === selectedId);
    setAttributes({
      selectedPageId: selectedId,
      selectedPageUrl: selectedPage ? selectedPage.link : homeUrl
    });
  };

  return (
    <ComboboxControl
      label={label}
      options={options}
      value={selectedPageId}
      onChange={handleChange}
    />
  );
};

export const fetchPagesOptions = async (home_url) => {
  const pages = await apiFetch({ path: '/wp/v2/pages' });
  if (pages && !pages.some(page => page.id === -1)) {
    pages.unshift({ id: -1, title: { rendered: 'ホーム' }, link: home_url });
  }
  return pages ? pages.map(page => ({
    value: page.id,
    label: page.title.rendered,
    link: page.link
  })) : [];
};

export const fetchArchiveOptions = async (home_url) => {
  const response = await apiFetch({ path: '/wp/v2/types' });
  let idCounter = 0;
  return Object.keys(response).reduce((acc, key) => {
    const postType = response[key];

    if (postType.has_archive === true) {
      acc.push({ value: idCounter++, link: `${home_url}/${postType.slug}`, label: postType.name });
    } else if (typeof postType.has_archive === 'string') {
      acc.push({ value: idCounter++, link: `${home_url}/${postType.has_archive}`, label: postType.name });
    }
    return acc;
  }, []);
};

export const PageSelectControl = (props) => (
  <SelectControl {...props} fetchOptions={fetchPagesOptions} />
);

export const ArchiveSelectControl = (props) => (
  <SelectControl {...props} fetchOptions={fetchArchiveOptions} />
);
