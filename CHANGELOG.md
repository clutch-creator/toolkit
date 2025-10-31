# @clutch-creator/toolkit

## 2.2.8

### Patch Changes

- 6a43135: Change default sizes prop to 'auto' in Image primitive

## 2.2.7

### Patch Changes

- a0b94a5: Generate object only stop when final output tool has been called
- a0b94a5: Stop stream ui with max steps and early return

## 2.2.6

### Patch Changes

- 9364620: Remove stop condition with number of tool calls

## 2.2.5

### Patch Changes

- 7857829: Generate object improve reliability

## 2.2.4

### Patch Changes

- dd3560c: Fix generate object final output name

## 2.2.3

### Patch Changes

- 2bca974: Fix generate object with better output enforcement

## 2.2.2

### Patch Changes

- 9cbb0c4: Include jsonSchema in the ai exports

## 2.2.1

### Patch Changes

- 58977a0: Update dependencies fixing latest ai package

## 2.2.0

### Minor Changes

- 987a9ed: Ai generate object function

## 2.1.0

### Minor Changes

- 42061b8: Added ai utilities for agents in clutch

## 2.0.1

### Patch Changes

- a52b328: Add basePath to URLs in sitemaps

## 2.0.0

### Major Changes

- 97b6691: Drop forms feature

### Patch Changes

- 2a7b9c2: Fix sitemap parsing when no dynamic path involved

## 1.12.0

### Minor Changes

- 7dddc15: Added hooks:

  useFormFieldError
  useFormFieldIsValidating
  useFormFieldIsValid
  useFormFieldIsDirty

  useForm now accepts min and max options

## 1.11.1

### Patch Changes

- 3c7ea1d: fix release

## 1.11.0

### Minor Changes

- 232d13e: Added useRegisterStyleSelectors and deprecate warning on clutchElementConfig
- a2288ca: Added forms state handling

## 1.10.0

### Minor Changes

- f853b70: Add useWarn hook

## 1.9.2

### Patch Changes

- 605cf79: Add system prompt to clutchFunctionConfig

## 1.9.1

### Patch Changes

- 7e64d5c: expose ID Select control

## 1.9.0

### Minor Changes

- 2d4efac: clutchFunctionConfig method

## 1.8.0

### Minor Changes

- 499a0cc: New StyleSelectors list

## 1.7.0

### Minor Changes

- 0ab7d01: make canonical url absolute if passed a relative path

## 1.6.4

### Patch Changes

- 3a55d8e: Simplify loop keys identification

## 1.6.3

### Patch Changes

- 98fc6c4: State keys shortening for better scoping

## 1.6.2

### Patch Changes

- 3ca4f58: Fix nested loops identification

## 1.6.1

### Patch Changes

- fa89fb6: Link data-disabled attr
- 3a1e273: Handle error responses on actions

## 1.6.0

### Minor Changes

- 66f0856: Added more helpers used in generated clutch app

## 1.5.1

### Patch Changes

- 58d24fb: Fix state key scope for better handling same instance renders in different loops iterations

## 1.5.0

### Minor Changes

- 0a242dd: Allow useRegisterAction props option to be a function that takes the same arguments as the action

## 1.4.3

### Patch Changes

- ef99e0d: Improve instances identification

## 1.4.2

### Patch Changes

- f519634: Fix unregister instance

## 1.4.1

### Patch Changes

- 75abd96: Drop bad unregister instance

## 1.4.0

### Minor Changes

- 8da72c4: Added instances state unregistering

## 1.3.2

### Patch Changes

- 517b927: Try to load image from fs for build time purposes

## 1.3.1

### Patch Changes

- 58a0209: Fix public images processing on clutch image component

## 1.3.0

### Minor Changes

- f9edcbb: Improve logger to work outside clutch debugging only

## 1.2.1

### Patch Changes

- e3030de: Client images default width and height

## 1.2.0

### Minor Changes

- 608c4d7: Client image render a next image similar to its server representation

## 1.1.1

### Patch Changes

- 1c4adad: Remove clutchId props on clone children

## 1.1.0

### Minor Changes

- 1046a42: Added not found redirect component

### Patch Changes

- a6feac1: Improve action registration and fix set state during render error

## 1.0.3

### Patch Changes

- 0cdb4e0: Remove use server from cache utils

## 1.0.2

### Patch Changes

- 2093a03: Fix svg loader
- 2093a03: Apply hooks allow children as a function or as nodes

## 1.0.1

### Patch Changes

- 9dcd96d: Added Slot component and cloneChildren util

## 1.0.0

### Major Changes

- 00ff348: First release
