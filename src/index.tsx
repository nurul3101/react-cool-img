/* eslint-disable jsx-a11y/alt-text, react-hooks/exhaustive-deps */

import React, {
  DetailedHTMLProps,
  ImgHTMLAttributes,
  SyntheticEvent,
  FC,
  useRef,
  useState,
  useEffect,
  memo,
} from "react";

import useObserver, { Options } from "./useObserver";
import * as storage from "./storage";
import Imager, { Retry } from "./Imager";

interface Props
  extends DetailedHTMLProps<
    ImgHTMLAttributes<HTMLImageElement>,
    HTMLImageElement
  > {
  className?: string;
  placeholder?: string;
  src: string;
  error?: string;
  crossOrigin?: "" | "anonymous" | "use-credentials";
  decode?: boolean;
  lazy?: boolean;
  cache?: boolean;
  debounce?: number;
  observerOptions?: Options;
  retry?: Retry;
  srcSet?: string;
  sizes?: string;
  onError?: (event: SyntheticEvent | Event) => void;
  onLoad?: (event: SyntheticEvent | Event) => void;
}

const Img: FC<Props> = ({
  className,
  placeholder,
  src,
  error,
  crossOrigin,
  decode,
  lazy,
  cache,
  debounce,
  observerOptions,
  retry,
  srcSet,
  sizes,
  onError,
  onLoad,
  ...rest
}: Props) => {
  const imagerRef = useRef<Imager>(new Imager());
  const [setRef, startLoad] = useObserver(debounce, observerOptions);
  const [source, setSource] = useState<string>(
    placeholder ||
      "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
  );
  const isSrc = source === src;
  const filename = src ? src.replace(/^.*[\\/]/, "").split(".")[0] : "";

  const handleError = (event: Event): void => {
    onError(event);

    if (error) {
      setSource(error);
    } else if (placeholder) {
      setSource(placeholder);
    }
  };

  const handleLoad = (event: Event): void => {
    onLoad(event);

    setSource(src);
    if (cache) storage.set(src);
  };

  useEffect(() => {
    const { current: imager } = imagerRef;
    const loadImg = (): void => {
      imager.load(src, crossOrigin, decode, retry, handleError, handleLoad);
    };

    if (!lazy || (cache && storage.get(src))) {
      loadImg();
    } else if (startLoad) {
      loadImg();
    }

    return (): void => {
      imager.unload();
    };
  }, [cache, startLoad, src, crossOrigin, decode, retry]);

  return (
    <>
      <img
        className={`${className} no-js-${filename}`}
        src={source}
        crossOrigin={isSrc ? crossOrigin : null}
        srcSet={isSrc ? srcSet : null}
        sizes={isSrc ? sizes : null}
        ref={setRef}
        {...rest}
      />
      {/* For SEO and JavaScript unavailable */}
      <noscript>
        <style>{`.no-js-${filename} { display: none !important; }`}</style>
        <img
          className={className}
          src={src}
          crossOrigin={crossOrigin}
          srcSet={srcSet}
          sizes={sizes}
          {...rest}
        />
      </noscript>
    </>
  );
};

Img.defaultProps = {
  className: "",
  placeholder: null,
  error: null,
  crossOrigin: null,
  decode: true,
  lazy: true,
  cache: true,
  debounce: 300,
  observerOptions: {},
  retry: {},
  srcSet: null,
  sizes: null,
  onError: /* istanbul ignore next */ (): void => null,
  onLoad: /* istanbul ignore next */ (): void => null,
};

export default memo(Img);
