/* eslint-disable import/first, jest/expect-expect */

const FAILURE_SRC = "FAILURE_SRC";
const SUCCESS_SRC = "SUCCESS_SRC";

jest.mock("../useObserver");

const set = jest.fn();
const get = jest.fn(() => false);
jest.mock("../storage", () => ({ set, get }));

const load = jest.fn((...args) =>
  args[args[0] === FAILURE_SRC ? 4 : 5]({ target: { src: args[0] } })
);
const unload = jest.fn();
jest.mock("../Imager", () => jest.fn(() => ({ load, unload })));

import React from "react";
import { render } from "@testing-library/react";

import useObserver from "../useObserver";
import * as storage from "../storage";
import Img from "..";

describe("<Img />", () => {
  const props = {
    className: "cool-image",
    placeholder: "PLACEHOLDER_SRC",
    error: "ERROR_SRC",
    crossOrigin: "anonymous" as const,
    decode: true,
    lazy: true,
    debounce: 300,
    observerOptions: { rootMargin: "50px", threshold: 0.01 },
    retry: { count: 5, delay: 2 },
    srcSet: "cool.png",
    sizes: "100vw",
    onError: jest.fn(),
    onLoad: jest.fn(),
    alt: "Cool Image",
  };

  const matchSnapshot = (img: JSX.Element): void => {
    expect(render(img).asFragment()).toMatchSnapshot();
  };
  const setStartLoad = (val = false): void => {
    const setState = (): void => null;
    // @ts-expect-error
    useObserver.mockImplementation(() => [setState, val, setState]);
  };

  beforeEach(() => {
    // @ts-expect-error
    storage.get.mockReset();
  });

  it("should setup useObserver's arguments correctly", () => {
    setStartLoad();
    render(<Img src={SUCCESS_SRC} {...props} />);

    const { debounce, observerOptions } = props;

    expect(useObserver).toHaveBeenCalledWith(debounce, observerOptions);
  });

  it("should unload src image", () => {
    setStartLoad();
    render(<Img src={SUCCESS_SRC} {...props} />).unmount();

    expect(unload).toHaveBeenCalled();
  });

  it("should render placeholder image", () => {
    setStartLoad();
    matchSnapshot(<Img src={SUCCESS_SRC} {...props} />);

    expect(load).not.toHaveBeenCalled();
    expect(props.onLoad).not.toHaveBeenCalled();
  });

  it("should render default placeholder image", () => {
    setStartLoad();
    matchSnapshot(<Img src={SUCCESS_SRC} {...props} placeholder={null} />);
  });

  it("should render placeholder image due to cache is disabled", () => {
    // @ts-expect-error
    storage.get.mockImplementation(() => true);

    setStartLoad();
    matchSnapshot(<Img src={SUCCESS_SRC} {...props} cache={false} />);

    expect(set).not.toHaveBeenCalled();
  });

  it("should render src image", () => {
    setStartLoad(true);
    matchSnapshot(<Img src={SUCCESS_SRC} {...props} />);

    const { crossOrigin, decode, retry, onLoad } = props;

    expect(load).toHaveBeenCalledWith(
      SUCCESS_SRC,
      crossOrigin,
      decode,
      retry,
      expect.any(Function),
      expect.any(Function)
    );
    expect(onLoad).toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith(SUCCESS_SRC);
  });

  it("should render src image immediately due to lazy is disabled", () => {
    setStartLoad();
    matchSnapshot(<Img src={SUCCESS_SRC} {...props} lazy={false} />);

    const { crossOrigin, decode, retry, onLoad } = props;

    expect(load).toHaveBeenCalledWith(
      SUCCESS_SRC,
      crossOrigin,
      decode,
      retry,
      expect.any(Function),
      expect.any(Function)
    );
    expect(onLoad).toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith(SUCCESS_SRC);
  });

  it("should render src image immediately due to image cached", () => {
    // @ts-expect-error
    storage.get.mockImplementation(() => true);

    setStartLoad();
    matchSnapshot(<Img src={SUCCESS_SRC} {...props} />);

    const { crossOrigin, decode, retry, onLoad } = props;

    expect(load).toHaveBeenCalledWith(
      SUCCESS_SRC,
      crossOrigin,
      decode,
      retry,
      expect.any(Function),
      expect.any(Function)
    );
    expect(onLoad).toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith(SUCCESS_SRC);
  });

  it("should render error image", () => {
    setStartLoad(true);
    matchSnapshot(<Img src={FAILURE_SRC} {...props} />);
  });

  it("should render placeholder image instead of error image", () => {
    setStartLoad(true);
    matchSnapshot(<Img src={FAILURE_SRC} {...props} error={null} />);
  });
});
