/* eslint-disable */

import { transform } from '@svgr/core';
import jsx from '@svgr/plugin-jsx';
import svgo from '@svgr/plugin-svgo';

export default async function SvgLoader(source) {
  this.cacheable && this.cacheable();
  const callback = this.async();

  try {
    if (this.resourceQuery && this.resourceQuery.includes('icon')) {
      let modifiedSource = source;

      if (this.resourceQuery.includes('replaceColors'))
        modifiedSource = source
          .replace(/fill="(?!none|transparent)[^"]*"/g, 'fill="currentColor"')
          .replace(
            /stroke="(?!none|transparent)[^"]*"/g,
            'stroke="currentColor"'
          );

      const namedJsCode = await transform(
        modifiedSource,
        {
          plugins: [svgo, jsx],
          icon: true,
          dimensions: false,
          exportType: 'named',
        },
        { componentName: 'ReactComponent', filePath: this.resourcePath }
      );
      callback(null, namedJsCode);
    } else {
      callback(
        null,
        `export default "data:image/svg+xml;base64,${btoa(source)}";`
      );
    }
  } catch (e) {
    callback(e);
  }
}
