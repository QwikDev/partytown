import * as assert from 'uvu/assert';
import {
  createElementFromConstructor,
  DEPRECATED_WINDOW_PROPERTIES,
  isValidMemberName,
} from '../../src/lib/utils';
import { suite } from './utils';

const test = suite();

test('createElementFromConstructor, SVG', ({ doc }) => {
  assert.is(createElementFromConstructor(doc, 'SVGFEFuncRElement')!.tagName, 'feFuncR');
  assert.is(
    createElementFromConstructor(doc, 'SVGFEGaussianBlurElement')!.tagName,
    'feGaussianBlur'
  );
  assert.is(createElementFromConstructor(doc, 'SVGFEBlendElement')!.tagName, 'feBlend');
  assert.is(createElementFromConstructor(doc, 'SVGForeignObjectElement')!.tagName, 'foreignObject');
  assert.is(
    createElementFromConstructor(doc, 'SVGLinearGradientElement')!.tagName,
    'linearGradient'
  );
  assert.is(createElementFromConstructor(doc, 'SVGClipPathElement')!.tagName, 'clipPath');
  assert.is(createElementFromConstructor(doc, 'SVGTSpanElement')!.tagName, 'tspan');
  assert.is(createElementFromConstructor(doc, 'SVGMPathElement')!.tagName, 'mpath');
  assert.is(createElementFromConstructor(doc, 'SVGDefsElement')!.tagName, 'defs');
  assert.is(createElementFromConstructor(doc, 'SVGGraphicsElement')!.tagName, 'g');
  assert.is(createElementFromConstructor(doc, 'SVGImageElement')!.tagName, 'image');
  assert.is(createElementFromConstructor(doc, 'SVGAElement')!.tagName, 'a');
  assert.is(createElementFromConstructor(doc, 'SVGPathElement')!.tagName, 'path');
  assert.is(createElementFromConstructor(doc, 'SVGSVGElement')!.tagName, 'svg');
  assert.is(createElementFromConstructor(doc, 'SVGGraphics'), undefined);
  assert.is(createElementFromConstructor(doc, 'GraphicsElement'), undefined);
});

test('createElementFromConstructor, HTML', ({ doc }) => {
  assert.is(createElementFromConstructor(doc, 'HTMLAnchorElement')!.tagName, 'A');
  assert.is(createElementFromConstructor(doc, 'HTMLDListElement')!.tagName, 'DL');
  assert.is(createElementFromConstructor(doc, 'HTMLImageElement')!.tagName, 'IMG');
  assert.is(createElementFromConstructor(doc, 'HTMLOListElement')!.tagName, 'OL');
  assert.is(createElementFromConstructor(doc, 'HTMLParagraphElement')!.tagName, 'P');
  assert.is(createElementFromConstructor(doc, 'HTMLTableCaptionElement')!.tagName, 'CAPTION');
  assert.is(createElementFromConstructor(doc, 'HTMLTableCellElement')!.tagName, 'TD');
  assert.is(createElementFromConstructor(doc, 'HTMLTableColElement')!.tagName, 'COLGROUP');
  assert.is(createElementFromConstructor(doc, 'HTMLTableRowElement')!.tagName, 'TR');
  assert.is(createElementFromConstructor(doc, 'HTMLTableSectionElement')!.tagName, 'TBODY');
  assert.is(createElementFromConstructor(doc, 'HTMLDivElement')!.tagName, 'DIV');
  assert.is(
    createElementFromConstructor(doc, 'HTMLDivElement')!.namespaceURI,
    'http://www.w3.org/1999/xhtml'
  );
  assert.is(createElementFromConstructor(doc, 'HTMLElement'), undefined);
  assert.is(createElementFromConstructor(doc, 'HTMLConstructor'), undefined);
  assert.is(createElementFromConstructor(doc, 'ConstructorElement'), undefined);
  assert.is(createElementFromConstructor(doc, 'IntersectionObserver'), undefined);
});

test('isValidMemberName rejects deprecated window properties', () => {
  for (const prop of DEPRECATED_WINDOW_PROPERTIES) {
    assert.is(isValidMemberName(prop), false, `${prop} should be rejected`);
  }
});

test('isValidMemberName rejects known invalid prefixes', () => {
  assert.is(isValidMemberName('webkitSpeechRecognition'), false);
  assert.is(isValidMemberName('toJSON'), false);
  assert.is(isValidMemberName('constructor'), false);
  assert.is(isValidMemberName('toString'), false);
  assert.is(isValidMemberName('_private'), false);
});

test('isValidMemberName accepts valid member names', () => {
  assert.is(isValidMemberName('document'), true);
  assert.is(isValidMemberName('localStorage'), true);
  assert.is(isValidMemberName('fetch'), true);
  assert.is(isValidMemberName('HTMLDivElement'), true);
  assert.is(isValidMemberName('addEventListener'), true);
});

test('DEPRECATED_WINDOW_PROPERTIES contains expected entries', () => {
  assert.ok(DEPRECATED_WINDOW_PROPERTIES.has('SharedStorage'));
  assert.ok(DEPRECATED_WINDOW_PROPERTIES.has('sharedStorage'));
  assert.ok(DEPRECATED_WINDOW_PROPERTIES.has('AttributionReporting'));
  assert.ok(DEPRECATED_WINDOW_PROPERTIES.has('attributionReporting'));
});

test.run();
