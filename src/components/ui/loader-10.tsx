import * as React from "react";
import { cn } from "@/lib/utils";

export interface GooeyLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The primary color for the goo effect. Defaults to app's primary color. */
  primaryColor?: string;
  /** The secondary color for the goo effect. Defaults to app's secondary color. */
  secondaryColor?: string;
  /** The color for the bottom border. Defaults to app's border color. */
  borderColor?: string;
  /** Size of the loader: small, medium, or large */
  size?: 'small' | 'medium' | 'large';
}

const GooeyLoader = React.forwardRef<HTMLDivElement, GooeyLoaderProps>(
  ({ className, primaryColor = "#d4a5a5", secondaryColor = "#f5f0e8", borderColor = "#d4a5a5", size = "medium", ...props }, ref) => {
    // Size configurations for responsive design
    const sizeConfig = {
      small: {
        containerClass: "w-24 h-6",
        loaderWidth: "6em",
        loaderHeight: "1.5em"
      },
      medium: {
        containerClass: "w-48 h-12",
        loaderWidth: "12em",
        loaderHeight: "3em"
      },
      large: {
        containerClass: "w-64 h-16",
        loaderWidth: "16em",
        loaderHeight: "4em"
      }
    };

    const config = sizeConfig[size];

    // CSS variables for dynamic styling
    const style = {
      "--gooey-primary-color": primaryColor,
      "--gooey-secondary-color": secondaryColor,
      "--gooey-border-color": borderColor,
      "--gooey-loader-width": config.loaderWidth,
      "--gooey-loader-height": config.loaderHeight,
    } as React.CSSProperties;

    return (
      <div
        ref={ref}
        className={cn("relative flex items-center justify-center text-sm", config.containerClass, className)}
        style={style}
        role="status"
        aria-label="Loading"
        {...props}
      >
        {/* SVG filter for the gooey effect */}
        <svg className="absolute w-0 h-0">
          <defs>
            <filter id="gooey-loader-filter">
              <feGaussianBlur in="SourceGraphic" stdDeviation={12} result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 48 -7"
                result="goo"
              />
              <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
          </defs>
        </svg>

        {/* Embedded styles for complex animations and pseudo-elements */}
        <style>
          {`
            .gooey-loader {
              width: var(--gooey-loader-width);
              height: var(--gooey-loader-height);
              position: relative;
              overflow: hidden;
              border-bottom: 8px solid var(--gooey-border-color);
              filter: url(#gooey-loader-filter);
            }

            .gooey-loader::before,
            .gooey-loader::after {
              content: '';
              position: absolute;
              border-radius: 50%;
            }

            .gooey-loader::before {
              width: 22em;
              height: 18em;
              background-color: var(--gooey-primary-color);
              left: -2em;
              bottom: -18em;
              animation: gooey-loader-wee1 2s linear infinite;
            }

            .gooey-loader::after {
              width: 16em;
              height: 12em;
              background-color: var(--gooey-secondary-color);
              left: -4em;
              bottom: -12em;
              animation: gooey-loader-wee2 2s linear infinite 0.75s;
            }

            @keyframes gooey-loader-wee1 {
              0% {
                transform: translateX(-10em) rotate(0deg);
              }
              100% {
                transform: translateX(7em) rotate(180deg);
              }
            }

            @keyframes gooey-loader-wee2 {
              0% {
                transform: translateX(-8em) rotate(0deg);
              }
              100% {
                transform: translateX(8em) rotate(180deg);
              }
            }

            /* Mobile optimizations */
            @media (max-width: 640px) {
              .gooey-loader {
                border-bottom-width: 6px;
              }
            }
          `}
        </style>

        {/* The loader element that the styles target */}
        <div className="gooey-loader" />
      </div>
    );
  }
);
GooeyLoader.displayName = "GooeyLoader";

export { GooeyLoader };
