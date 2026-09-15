import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a2, b) => (typeof require !== "undefined" ? require : a2)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/commander/lib/error.js
var require_error = __commonJS({
  "node_modules/commander/lib/error.js"(exports) {
    var CommanderError2 = class extends Error {
      /**
       * Constructs the CommanderError class
       * @param {number} exitCode suggested exit code which could be used with process.exit
       * @param {string} code an id string representing the error
       * @param {string} message human-readable description of the error
       */
      constructor(exitCode, code, message) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.code = code;
        this.exitCode = exitCode;
        this.nestedError = void 0;
      }
    };
    var InvalidArgumentError2 = class extends CommanderError2 {
      /**
       * Constructs the InvalidArgumentError class
       * @param {string} [message] explanation of why argument is invalid
       */
      constructor(message) {
        super(1, "commander.invalidArgument", message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
      }
    };
    exports.CommanderError = CommanderError2;
    exports.InvalidArgumentError = InvalidArgumentError2;
  }
});

// node_modules/commander/lib/argument.js
var require_argument = __commonJS({
  "node_modules/commander/lib/argument.js"(exports) {
    var { InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var Argument2 = class {
      /**
       * Initialize a new command argument with the given name and description.
       * The default is that the argument is required, and you can explicitly
       * indicate this with <> around the name. Put [] around the name for an optional argument.
       *
       * @param {string} name
       * @param {string} [description]
       */
      constructor(name2, description) {
        this.description = description || "";
        this.variadic = false;
        this.parseArg = void 0;
        this.defaultValue = void 0;
        this.defaultValueDescription = void 0;
        this.argChoices = void 0;
        switch (name2[0]) {
          case "<":
            this.required = true;
            this._name = name2.slice(1, -1);
            break;
          case "[":
            this.required = false;
            this._name = name2.slice(1, -1);
            break;
          default:
            this.required = true;
            this._name = name2;
            break;
        }
        if (this._name.length > 3 && this._name.slice(-3) === "...") {
          this.variadic = true;
          this._name = this._name.slice(0, -3);
        }
      }
      /**
       * Return argument name.
       *
       * @return {string}
       */
      name() {
        return this._name;
      }
      /**
       * @package
       */
      _concatValue(value, previous) {
        if (previous === this.defaultValue || !Array.isArray(previous)) {
          return [value];
        }
        return previous.concat(value);
      }
      /**
       * Set the default value, and optionally supply the description to be displayed in the help.
       *
       * @param {*} value
       * @param {string} [description]
       * @return {Argument}
       */
      default(value, description) {
        this.defaultValue = value;
        this.defaultValueDescription = description;
        return this;
      }
      /**
       * Set the custom handler for processing CLI command arguments into argument values.
       *
       * @param {Function} [fn]
       * @return {Argument}
       */
      argParser(fn) {
        this.parseArg = fn;
        return this;
      }
      /**
       * Only allow argument value to be one of choices.
       *
       * @param {string[]} values
       * @return {Argument}
       */
      choices(values) {
        this.argChoices = values.slice();
        this.parseArg = (arg, previous) => {
          if (!this.argChoices.includes(arg)) {
            throw new InvalidArgumentError2(
              `Allowed choices are ${this.argChoices.join(", ")}.`
            );
          }
          if (this.variadic) {
            return this._concatValue(arg, previous);
          }
          return arg;
        };
        return this;
      }
      /**
       * Make argument required.
       *
       * @returns {Argument}
       */
      argRequired() {
        this.required = true;
        return this;
      }
      /**
       * Make argument optional.
       *
       * @returns {Argument}
       */
      argOptional() {
        this.required = false;
        return this;
      }
    };
    function humanReadableArgName(arg) {
      const nameOutput = arg.name() + (arg.variadic === true ? "..." : "");
      return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
    }
    exports.Argument = Argument2;
    exports.humanReadableArgName = humanReadableArgName;
  }
});

// node_modules/commander/lib/help.js
var require_help = __commonJS({
  "node_modules/commander/lib/help.js"(exports) {
    var { humanReadableArgName } = require_argument();
    var Help2 = class {
      constructor() {
        this.helpWidth = void 0;
        this.minWidthToWrap = 40;
        this.sortSubcommands = false;
        this.sortOptions = false;
        this.showGlobalOptions = false;
      }
      /**
       * prepareContext is called by Commander after applying overrides from `Command.configureHelp()`
       * and just before calling `formatHelp()`.
       *
       * Commander just uses the helpWidth and the rest is provided for optional use by more complex subclasses.
       *
       * @param {{ error?: boolean, helpWidth?: number, outputHasColors?: boolean }} contextOptions
       */
      prepareContext(contextOptions) {
        this.helpWidth = this.helpWidth ?? contextOptions.helpWidth ?? 80;
      }
      /**
       * Get an array of the visible subcommands. Includes a placeholder for the implicit help command, if there is one.
       *
       * @param {Command} cmd
       * @returns {Command[]}
       */
      visibleCommands(cmd) {
        const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden);
        const helpCommand = cmd._getHelpCommand();
        if (helpCommand && !helpCommand._hidden) {
          visibleCommands.push(helpCommand);
        }
        if (this.sortSubcommands) {
          visibleCommands.sort((a2, b) => {
            return a2.name().localeCompare(b.name());
          });
        }
        return visibleCommands;
      }
      /**
       * Compare options for sort.
       *
       * @param {Option} a
       * @param {Option} b
       * @returns {number}
       */
      compareOptions(a2, b) {
        const getSortKey = (option) => {
          return option.short ? option.short.replace(/^-/, "") : option.long.replace(/^--/, "");
        };
        return getSortKey(a2).localeCompare(getSortKey(b));
      }
      /**
       * Get an array of the visible options. Includes a placeholder for the implicit help option, if there is one.
       *
       * @param {Command} cmd
       * @returns {Option[]}
       */
      visibleOptions(cmd) {
        const visibleOptions = cmd.options.filter((option) => !option.hidden);
        const helpOption = cmd._getHelpOption();
        if (helpOption && !helpOption.hidden) {
          const removeShort = helpOption.short && cmd._findOption(helpOption.short);
          const removeLong = helpOption.long && cmd._findOption(helpOption.long);
          if (!removeShort && !removeLong) {
            visibleOptions.push(helpOption);
          } else if (helpOption.long && !removeLong) {
            visibleOptions.push(
              cmd.createOption(helpOption.long, helpOption.description)
            );
          } else if (helpOption.short && !removeShort) {
            visibleOptions.push(
              cmd.createOption(helpOption.short, helpOption.description)
            );
          }
        }
        if (this.sortOptions) {
          visibleOptions.sort(this.compareOptions);
        }
        return visibleOptions;
      }
      /**
       * Get an array of the visible global options. (Not including help.)
       *
       * @param {Command} cmd
       * @returns {Option[]}
       */
      visibleGlobalOptions(cmd) {
        if (!this.showGlobalOptions) return [];
        const globalOptions = [];
        for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
          const visibleOptions = ancestorCmd.options.filter(
            (option) => !option.hidden
          );
          globalOptions.push(...visibleOptions);
        }
        if (this.sortOptions) {
          globalOptions.sort(this.compareOptions);
        }
        return globalOptions;
      }
      /**
       * Get an array of the arguments if any have a description.
       *
       * @param {Command} cmd
       * @returns {Argument[]}
       */
      visibleArguments(cmd) {
        if (cmd._argsDescription) {
          cmd.registeredArguments.forEach((argument) => {
            argument.description = argument.description || cmd._argsDescription[argument.name()] || "";
          });
        }
        if (cmd.registeredArguments.find((argument) => argument.description)) {
          return cmd.registeredArguments;
        }
        return [];
      }
      /**
       * Get the command term to show in the list of subcommands.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      subcommandTerm(cmd) {
        const args = cmd.registeredArguments.map((arg) => humanReadableArgName(arg)).join(" ");
        return cmd._name + (cmd._aliases[0] ? "|" + cmd._aliases[0] : "") + (cmd.options.length ? " [options]" : "") + // simplistic check for non-help option
        (args ? " " + args : "");
      }
      /**
       * Get the option term to show in the list of options.
       *
       * @param {Option} option
       * @returns {string}
       */
      optionTerm(option) {
        return option.flags;
      }
      /**
       * Get the argument term to show in the list of arguments.
       *
       * @param {Argument} argument
       * @returns {string}
       */
      argumentTerm(argument) {
        return argument.name();
      }
      /**
       * Get the longest command term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestSubcommandTermLength(cmd, helper) {
        return helper.visibleCommands(cmd).reduce((max, command) => {
          return Math.max(
            max,
            this.displayWidth(
              helper.styleSubcommandTerm(helper.subcommandTerm(command))
            )
          );
        }, 0);
      }
      /**
       * Get the longest option term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestOptionTermLength(cmd, helper) {
        return helper.visibleOptions(cmd).reduce((max, option) => {
          return Math.max(
            max,
            this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option)))
          );
        }, 0);
      }
      /**
       * Get the longest global option term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestGlobalOptionTermLength(cmd, helper) {
        return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
          return Math.max(
            max,
            this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option)))
          );
        }, 0);
      }
      /**
       * Get the longest argument term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestArgumentTermLength(cmd, helper) {
        return helper.visibleArguments(cmd).reduce((max, argument) => {
          return Math.max(
            max,
            this.displayWidth(
              helper.styleArgumentTerm(helper.argumentTerm(argument))
            )
          );
        }, 0);
      }
      /**
       * Get the command usage to be displayed at the top of the built-in help.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      commandUsage(cmd) {
        let cmdName = cmd._name;
        if (cmd._aliases[0]) {
          cmdName = cmdName + "|" + cmd._aliases[0];
        }
        let ancestorCmdNames = "";
        for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
          ancestorCmdNames = ancestorCmd.name() + " " + ancestorCmdNames;
        }
        return ancestorCmdNames + cmdName + " " + cmd.usage();
      }
      /**
       * Get the description for the command.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      commandDescription(cmd) {
        return cmd.description();
      }
      /**
       * Get the subcommand summary to show in the list of subcommands.
       * (Fallback to description for backwards compatibility.)
       *
       * @param {Command} cmd
       * @returns {string}
       */
      subcommandDescription(cmd) {
        return cmd.summary() || cmd.description();
      }
      /**
       * Get the option description to show in the list of options.
       *
       * @param {Option} option
       * @return {string}
       */
      optionDescription(option) {
        const extraInfo = [];
        if (option.argChoices) {
          extraInfo.push(
            // use stringify to match the display of the default value
            `choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`
          );
        }
        if (option.defaultValue !== void 0) {
          const showDefault = option.required || option.optional || option.isBoolean() && typeof option.defaultValue === "boolean";
          if (showDefault) {
            extraInfo.push(
              `default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`
            );
          }
        }
        if (option.presetArg !== void 0 && option.optional) {
          extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
        }
        if (option.envVar !== void 0) {
          extraInfo.push(`env: ${option.envVar}`);
        }
        if (extraInfo.length > 0) {
          return `${option.description} (${extraInfo.join(", ")})`;
        }
        return option.description;
      }
      /**
       * Get the argument description to show in the list of arguments.
       *
       * @param {Argument} argument
       * @return {string}
       */
      argumentDescription(argument) {
        const extraInfo = [];
        if (argument.argChoices) {
          extraInfo.push(
            // use stringify to match the display of the default value
            `choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`
          );
        }
        if (argument.defaultValue !== void 0) {
          extraInfo.push(
            `default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`
          );
        }
        if (extraInfo.length > 0) {
          const extraDescription = `(${extraInfo.join(", ")})`;
          if (argument.description) {
            return `${argument.description} ${extraDescription}`;
          }
          return extraDescription;
        }
        return argument.description;
      }
      /**
       * Generate the built-in help text.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {string}
       */
      formatHelp(cmd, helper) {
        const termWidth = helper.padWidth(cmd, helper);
        const helpWidth = helper.helpWidth ?? 80;
        function callFormatItem(term, description) {
          return helper.formatItem(term, termWidth, description, helper);
        }
        let output = [
          `${helper.styleTitle("Usage:")} ${helper.styleUsage(helper.commandUsage(cmd))}`,
          ""
        ];
        const commandDescription = helper.commandDescription(cmd);
        if (commandDescription.length > 0) {
          output = output.concat([
            helper.boxWrap(
              helper.styleCommandDescription(commandDescription),
              helpWidth
            ),
            ""
          ]);
        }
        const argumentList = helper.visibleArguments(cmd).map((argument) => {
          return callFormatItem(
            helper.styleArgumentTerm(helper.argumentTerm(argument)),
            helper.styleArgumentDescription(helper.argumentDescription(argument))
          );
        });
        if (argumentList.length > 0) {
          output = output.concat([
            helper.styleTitle("Arguments:"),
            ...argumentList,
            ""
          ]);
        }
        const optionList = helper.visibleOptions(cmd).map((option) => {
          return callFormatItem(
            helper.styleOptionTerm(helper.optionTerm(option)),
            helper.styleOptionDescription(helper.optionDescription(option))
          );
        });
        if (optionList.length > 0) {
          output = output.concat([
            helper.styleTitle("Options:"),
            ...optionList,
            ""
          ]);
        }
        if (helper.showGlobalOptions) {
          const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
            return callFormatItem(
              helper.styleOptionTerm(helper.optionTerm(option)),
              helper.styleOptionDescription(helper.optionDescription(option))
            );
          });
          if (globalOptionList.length > 0) {
            output = output.concat([
              helper.styleTitle("Global Options:"),
              ...globalOptionList,
              ""
            ]);
          }
        }
        const commandList = helper.visibleCommands(cmd).map((cmd2) => {
          return callFormatItem(
            helper.styleSubcommandTerm(helper.subcommandTerm(cmd2)),
            helper.styleSubcommandDescription(helper.subcommandDescription(cmd2))
          );
        });
        if (commandList.length > 0) {
          output = output.concat([
            helper.styleTitle("Commands:"),
            ...commandList,
            ""
          ]);
        }
        return output.join("\n");
      }
      /**
       * Return display width of string, ignoring ANSI escape sequences. Used in padding and wrapping calculations.
       *
       * @param {string} str
       * @returns {number}
       */
      displayWidth(str) {
        return stripColor(str).length;
      }
      /**
       * Style the title for displaying in the help. Called with 'Usage:', 'Options:', etc.
       *
       * @param {string} str
       * @returns {string}
       */
      styleTitle(str) {
        return str;
      }
      styleUsage(str) {
        return str.split(" ").map((word) => {
          if (word === "[options]") return this.styleOptionText(word);
          if (word === "[command]") return this.styleSubcommandText(word);
          if (word[0] === "[" || word[0] === "<")
            return this.styleArgumentText(word);
          return this.styleCommandText(word);
        }).join(" ");
      }
      styleCommandDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleOptionDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleSubcommandDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleArgumentDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleDescriptionText(str) {
        return str;
      }
      styleOptionTerm(str) {
        return this.styleOptionText(str);
      }
      styleSubcommandTerm(str) {
        return str.split(" ").map((word) => {
          if (word === "[options]") return this.styleOptionText(word);
          if (word[0] === "[" || word[0] === "<")
            return this.styleArgumentText(word);
          return this.styleSubcommandText(word);
        }).join(" ");
      }
      styleArgumentTerm(str) {
        return this.styleArgumentText(str);
      }
      styleOptionText(str) {
        return str;
      }
      styleArgumentText(str) {
        return str;
      }
      styleSubcommandText(str) {
        return str;
      }
      styleCommandText(str) {
        return str;
      }
      /**
       * Calculate the pad width from the maximum term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      padWidth(cmd, helper) {
        return Math.max(
          helper.longestOptionTermLength(cmd, helper),
          helper.longestGlobalOptionTermLength(cmd, helper),
          helper.longestSubcommandTermLength(cmd, helper),
          helper.longestArgumentTermLength(cmd, helper)
        );
      }
      /**
       * Detect manually wrapped and indented strings by checking for line break followed by whitespace.
       *
       * @param {string} str
       * @returns {boolean}
       */
      preformatted(str) {
        return /\n[^\S\r\n]/.test(str);
      }
      /**
       * Format the "item", which consists of a term and description. Pad the term and wrap the description, indenting the following lines.
       *
       * So "TTT", 5, "DDD DDDD DD DDD" might be formatted for this.helpWidth=17 like so:
       *   TTT  DDD DDDD
       *        DD DDD
       *
       * @param {string} term
       * @param {number} termWidth
       * @param {string} description
       * @param {Help} helper
       * @returns {string}
       */
      formatItem(term, termWidth, description, helper) {
        const itemIndent = 2;
        const itemIndentStr = " ".repeat(itemIndent);
        if (!description) return itemIndentStr + term;
        const paddedTerm = term.padEnd(
          termWidth + term.length - helper.displayWidth(term)
        );
        const spacerWidth = 2;
        const helpWidth = this.helpWidth ?? 80;
        const remainingWidth = helpWidth - termWidth - spacerWidth - itemIndent;
        let formattedDescription;
        if (remainingWidth < this.minWidthToWrap || helper.preformatted(description)) {
          formattedDescription = description;
        } else {
          const wrappedDescription = helper.boxWrap(description, remainingWidth);
          formattedDescription = wrappedDescription.replace(
            /\n/g,
            "\n" + " ".repeat(termWidth + spacerWidth)
          );
        }
        return itemIndentStr + paddedTerm + " ".repeat(spacerWidth) + formattedDescription.replace(/\n/g, `
${itemIndentStr}`);
      }
      /**
       * Wrap a string at whitespace, preserving existing line breaks.
       * Wrapping is skipped if the width is less than `minWidthToWrap`.
       *
       * @param {string} str
       * @param {number} width
       * @returns {string}
       */
      boxWrap(str, width2) {
        if (width2 < this.minWidthToWrap) return str;
        const rawLines = str.split(/\r\n|\n/);
        const chunkPattern = /[\s]*[^\s]+/g;
        const wrappedLines = [];
        rawLines.forEach((line) => {
          const chunks = line.match(chunkPattern);
          if (chunks === null) {
            wrappedLines.push("");
            return;
          }
          let sumChunks = [chunks.shift()];
          let sumWidth = this.displayWidth(sumChunks[0]);
          chunks.forEach((chunk) => {
            const visibleWidth = this.displayWidth(chunk);
            if (sumWidth + visibleWidth <= width2) {
              sumChunks.push(chunk);
              sumWidth += visibleWidth;
              return;
            }
            wrappedLines.push(sumChunks.join(""));
            const nextChunk = chunk.trimStart();
            sumChunks = [nextChunk];
            sumWidth = this.displayWidth(nextChunk);
          });
          wrappedLines.push(sumChunks.join(""));
        });
        return wrappedLines.join("\n");
      }
    };
    function stripColor(str) {
      const sgrPattern = /\x1b\[\d*(;\d*)*m/g;
      return str.replace(sgrPattern, "");
    }
    exports.Help = Help2;
    exports.stripColor = stripColor;
  }
});

// node_modules/commander/lib/option.js
var require_option = __commonJS({
  "node_modules/commander/lib/option.js"(exports) {
    var { InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var Option2 = class {
      /**
       * Initialize a new `Option` with the given `flags` and `description`.
       *
       * @param {string} flags
       * @param {string} [description]
       */
      constructor(flags, description) {
        this.flags = flags;
        this.description = description || "";
        this.required = flags.includes("<");
        this.optional = flags.includes("[");
        this.variadic = /\w\.\.\.[>\]]$/.test(flags);
        this.mandatory = false;
        const optionFlags = splitOptionFlags(flags);
        this.short = optionFlags.shortFlag;
        this.long = optionFlags.longFlag;
        this.negate = false;
        if (this.long) {
          this.negate = this.long.startsWith("--no-");
        }
        this.defaultValue = void 0;
        this.defaultValueDescription = void 0;
        this.presetArg = void 0;
        this.envVar = void 0;
        this.parseArg = void 0;
        this.hidden = false;
        this.argChoices = void 0;
        this.conflictsWith = [];
        this.implied = void 0;
      }
      /**
       * Set the default value, and optionally supply the description to be displayed in the help.
       *
       * @param {*} value
       * @param {string} [description]
       * @return {Option}
       */
      default(value, description) {
        this.defaultValue = value;
        this.defaultValueDescription = description;
        return this;
      }
      /**
       * Preset to use when option used without option-argument, especially optional but also boolean and negated.
       * The custom processing (parseArg) is called.
       *
       * @example
       * new Option('--color').default('GREYSCALE').preset('RGB');
       * new Option('--donate [amount]').preset('20').argParser(parseFloat);
       *
       * @param {*} arg
       * @return {Option}
       */
      preset(arg) {
        this.presetArg = arg;
        return this;
      }
      /**
       * Add option name(s) that conflict with this option.
       * An error will be displayed if conflicting options are found during parsing.
       *
       * @example
       * new Option('--rgb').conflicts('cmyk');
       * new Option('--js').conflicts(['ts', 'jsx']);
       *
       * @param {(string | string[])} names
       * @return {Option}
       */
      conflicts(names) {
        this.conflictsWith = this.conflictsWith.concat(names);
        return this;
      }
      /**
       * Specify implied option values for when this option is set and the implied options are not.
       *
       * The custom processing (parseArg) is not called on the implied values.
       *
       * @example
       * program
       *   .addOption(new Option('--log', 'write logging information to file'))
       *   .addOption(new Option('--trace', 'log extra details').implies({ log: 'trace.txt' }));
       *
       * @param {object} impliedOptionValues
       * @return {Option}
       */
      implies(impliedOptionValues) {
        let newImplied = impliedOptionValues;
        if (typeof impliedOptionValues === "string") {
          newImplied = { [impliedOptionValues]: true };
        }
        this.implied = Object.assign(this.implied || {}, newImplied);
        return this;
      }
      /**
       * Set environment variable to check for option value.
       *
       * An environment variable is only used if when processed the current option value is
       * undefined, or the source of the current value is 'default' or 'config' or 'env'.
       *
       * @param {string} name
       * @return {Option}
       */
      env(name2) {
        this.envVar = name2;
        return this;
      }
      /**
       * Set the custom handler for processing CLI option arguments into option values.
       *
       * @param {Function} [fn]
       * @return {Option}
       */
      argParser(fn) {
        this.parseArg = fn;
        return this;
      }
      /**
       * Whether the option is mandatory and must have a value after parsing.
       *
       * @param {boolean} [mandatory=true]
       * @return {Option}
       */
      makeOptionMandatory(mandatory = true) {
        this.mandatory = !!mandatory;
        return this;
      }
      /**
       * Hide option in help.
       *
       * @param {boolean} [hide=true]
       * @return {Option}
       */
      hideHelp(hide = true) {
        this.hidden = !!hide;
        return this;
      }
      /**
       * @package
       */
      _concatValue(value, previous) {
        if (previous === this.defaultValue || !Array.isArray(previous)) {
          return [value];
        }
        return previous.concat(value);
      }
      /**
       * Only allow option value to be one of choices.
       *
       * @param {string[]} values
       * @return {Option}
       */
      choices(values) {
        this.argChoices = values.slice();
        this.parseArg = (arg, previous) => {
          if (!this.argChoices.includes(arg)) {
            throw new InvalidArgumentError2(
              `Allowed choices are ${this.argChoices.join(", ")}.`
            );
          }
          if (this.variadic) {
            return this._concatValue(arg, previous);
          }
          return arg;
        };
        return this;
      }
      /**
       * Return option name.
       *
       * @return {string}
       */
      name() {
        if (this.long) {
          return this.long.replace(/^--/, "");
        }
        return this.short.replace(/^-/, "");
      }
      /**
       * Return option name, in a camelcase format that can be used
       * as an object attribute key.
       *
       * @return {string}
       */
      attributeName() {
        if (this.negate) {
          return camelcase(this.name().replace(/^no-/, ""));
        }
        return camelcase(this.name());
      }
      /**
       * Check if `arg` matches the short or long flag.
       *
       * @param {string} arg
       * @return {boolean}
       * @package
       */
      is(arg) {
        return this.short === arg || this.long === arg;
      }
      /**
       * Return whether a boolean option.
       *
       * Options are one of boolean, negated, required argument, or optional argument.
       *
       * @return {boolean}
       * @package
       */
      isBoolean() {
        return !this.required && !this.optional && !this.negate;
      }
    };
    var DualOptions = class {
      /**
       * @param {Option[]} options
       */
      constructor(options) {
        this.positiveOptions = /* @__PURE__ */ new Map();
        this.negativeOptions = /* @__PURE__ */ new Map();
        this.dualOptions = /* @__PURE__ */ new Set();
        options.forEach((option) => {
          if (option.negate) {
            this.negativeOptions.set(option.attributeName(), option);
          } else {
            this.positiveOptions.set(option.attributeName(), option);
          }
        });
        this.negativeOptions.forEach((value, key) => {
          if (this.positiveOptions.has(key)) {
            this.dualOptions.add(key);
          }
        });
      }
      /**
       * Did the value come from the option, and not from possible matching dual option?
       *
       * @param {*} value
       * @param {Option} option
       * @returns {boolean}
       */
      valueFromOption(value, option) {
        const optionKey = option.attributeName();
        if (!this.dualOptions.has(optionKey)) return true;
        const preset = this.negativeOptions.get(optionKey).presetArg;
        const negativeValue = preset !== void 0 ? preset : false;
        return option.negate === (negativeValue === value);
      }
    };
    function camelcase(str) {
      return str.split("-").reduce((str2, word) => {
        return str2 + word[0].toUpperCase() + word.slice(1);
      });
    }
    function splitOptionFlags(flags) {
      let shortFlag;
      let longFlag;
      const shortFlagExp = /^-[^-]$/;
      const longFlagExp = /^--[^-]/;
      const flagParts = flags.split(/[ |,]+/).concat("guard");
      if (shortFlagExp.test(flagParts[0])) shortFlag = flagParts.shift();
      if (longFlagExp.test(flagParts[0])) longFlag = flagParts.shift();
      if (!shortFlag && shortFlagExp.test(flagParts[0]))
        shortFlag = flagParts.shift();
      if (!shortFlag && longFlagExp.test(flagParts[0])) {
        shortFlag = longFlag;
        longFlag = flagParts.shift();
      }
      if (flagParts[0].startsWith("-")) {
        const unsupportedFlag = flagParts[0];
        const baseError = `option creation failed due to '${unsupportedFlag}' in option flags '${flags}'`;
        if (/^-[^-][^-]/.test(unsupportedFlag))
          throw new Error(
            `${baseError}
- a short flag is a single dash and a single character
  - either use a single dash and a single character (for a short flag)
  - or use a double dash for a long option (and can have two, like '--ws, --workspace')`
          );
        if (shortFlagExp.test(unsupportedFlag))
          throw new Error(`${baseError}
- too many short flags`);
        if (longFlagExp.test(unsupportedFlag))
          throw new Error(`${baseError}
- too many long flags`);
        throw new Error(`${baseError}
- unrecognised flag format`);
      }
      if (shortFlag === void 0 && longFlag === void 0)
        throw new Error(
          `option creation failed due to no flags found in '${flags}'.`
        );
      return { shortFlag, longFlag };
    }
    exports.Option = Option2;
    exports.DualOptions = DualOptions;
  }
});

// node_modules/commander/lib/suggestSimilar.js
var require_suggestSimilar = __commonJS({
  "node_modules/commander/lib/suggestSimilar.js"(exports) {
    var maxDistance = 3;
    function editDistance(a2, b) {
      if (Math.abs(a2.length - b.length) > maxDistance)
        return Math.max(a2.length, b.length);
      const d = [];
      for (let i2 = 0; i2 <= a2.length; i2++) {
        d[i2] = [i2];
      }
      for (let j = 0; j <= b.length; j++) {
        d[0][j] = j;
      }
      for (let j = 1; j <= b.length; j++) {
        for (let i2 = 1; i2 <= a2.length; i2++) {
          let cost = 1;
          if (a2[i2 - 1] === b[j - 1]) {
            cost = 0;
          } else {
            cost = 1;
          }
          d[i2][j] = Math.min(
            d[i2 - 1][j] + 1,
            // deletion
            d[i2][j - 1] + 1,
            // insertion
            d[i2 - 1][j - 1] + cost
            // substitution
          );
          if (i2 > 1 && j > 1 && a2[i2 - 1] === b[j - 2] && a2[i2 - 2] === b[j - 1]) {
            d[i2][j] = Math.min(d[i2][j], d[i2 - 2][j - 2] + 1);
          }
        }
      }
      return d[a2.length][b.length];
    }
    function suggestSimilar(word, candidates) {
      if (!candidates || candidates.length === 0) return "";
      candidates = Array.from(new Set(candidates));
      const searchingOptions = word.startsWith("--");
      if (searchingOptions) {
        word = word.slice(2);
        candidates = candidates.map((candidate) => candidate.slice(2));
      }
      let similar = [];
      let bestDistance = maxDistance;
      const minSimilarity = 0.4;
      candidates.forEach((candidate) => {
        if (candidate.length <= 1) return;
        const distance = editDistance(word, candidate);
        const length = Math.max(word.length, candidate.length);
        const similarity = (length - distance) / length;
        if (similarity > minSimilarity) {
          if (distance < bestDistance) {
            bestDistance = distance;
            similar = [candidate];
          } else if (distance === bestDistance) {
            similar.push(candidate);
          }
        }
      });
      similar.sort((a2, b) => a2.localeCompare(b));
      if (searchingOptions) {
        similar = similar.map((candidate) => `--${candidate}`);
      }
      if (similar.length > 1) {
        return `
(Did you mean one of ${similar.join(", ")}?)`;
      }
      if (similar.length === 1) {
        return `
(Did you mean ${similar[0]}?)`;
      }
      return "";
    }
    exports.suggestSimilar = suggestSimilar;
  }
});

// node_modules/commander/lib/command.js
var require_command = __commonJS({
  "node_modules/commander/lib/command.js"(exports) {
    var EventEmitter = __require("node:events").EventEmitter;
    var childProcess = __require("node:child_process");
    var path = __require("node:path");
    var fs = __require("node:fs");
    var process2 = __require("node:process");
    var { Argument: Argument2, humanReadableArgName } = require_argument();
    var { CommanderError: CommanderError2 } = require_error();
    var { Help: Help2, stripColor } = require_help();
    var { Option: Option2, DualOptions } = require_option();
    var { suggestSimilar } = require_suggestSimilar();
    var Command2 = class _Command extends EventEmitter {
      /**
       * Initialize a new `Command`.
       *
       * @param {string} [name]
       */
      constructor(name2) {
        super();
        this.commands = [];
        this.options = [];
        this.parent = null;
        this._allowUnknownOption = false;
        this._allowExcessArguments = false;
        this.registeredArguments = [];
        this._args = this.registeredArguments;
        this.args = [];
        this.rawArgs = [];
        this.processedArgs = [];
        this._scriptPath = null;
        this._name = name2 || "";
        this._optionValues = {};
        this._optionValueSources = {};
        this._storeOptionsAsProperties = false;
        this._actionHandler = null;
        this._executableHandler = false;
        this._executableFile = null;
        this._executableDir = null;
        this._defaultCommandName = null;
        this._exitCallback = null;
        this._aliases = [];
        this._combineFlagAndOptionalValue = true;
        this._description = "";
        this._summary = "";
        this._argsDescription = void 0;
        this._enablePositionalOptions = false;
        this._passThroughOptions = false;
        this._lifeCycleHooks = {};
        this._showHelpAfterError = false;
        this._showSuggestionAfterError = true;
        this._savedState = null;
        this._outputConfiguration = {
          writeOut: (str) => process2.stdout.write(str),
          writeErr: (str) => process2.stderr.write(str),
          outputError: (str, write2) => write2(str),
          getOutHelpWidth: () => process2.stdout.isTTY ? process2.stdout.columns : void 0,
          getErrHelpWidth: () => process2.stderr.isTTY ? process2.stderr.columns : void 0,
          getOutHasColors: () => useColor() ?? (process2.stdout.isTTY && process2.stdout.hasColors?.()),
          getErrHasColors: () => useColor() ?? (process2.stderr.isTTY && process2.stderr.hasColors?.()),
          stripColor: (str) => stripColor(str)
        };
        this._hidden = false;
        this._helpOption = void 0;
        this._addImplicitHelpCommand = void 0;
        this._helpCommand = void 0;
        this._helpConfiguration = {};
      }
      /**
       * Copy settings that are useful to have in common across root command and subcommands.
       *
       * (Used internally when adding a command using `.command()` so subcommands inherit parent settings.)
       *
       * @param {Command} sourceCommand
       * @return {Command} `this` command for chaining
       */
      copyInheritedSettings(sourceCommand) {
        this._outputConfiguration = sourceCommand._outputConfiguration;
        this._helpOption = sourceCommand._helpOption;
        this._helpCommand = sourceCommand._helpCommand;
        this._helpConfiguration = sourceCommand._helpConfiguration;
        this._exitCallback = sourceCommand._exitCallback;
        this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
        this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
        this._allowExcessArguments = sourceCommand._allowExcessArguments;
        this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
        this._showHelpAfterError = sourceCommand._showHelpAfterError;
        this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
        return this;
      }
      /**
       * @returns {Command[]}
       * @private
       */
      _getCommandAndAncestors() {
        const result = [];
        for (let command = this; command; command = command.parent) {
          result.push(command);
        }
        return result;
      }
      /**
       * Define a command.
       *
       * There are two styles of command: pay attention to where to put the description.
       *
       * @example
       * // Command implemented using action handler (description is supplied separately to `.command`)
       * program
       *   .command('clone <source> [destination]')
       *   .description('clone a repository into a newly created directory')
       *   .action((source, destination) => {
       *     console.log('clone command called');
       *   });
       *
       * // Command implemented using separate executable file (description is second parameter to `.command`)
       * program
       *   .command('start <service>', 'start named service')
       *   .command('stop [service]', 'stop named service, or all if no name supplied');
       *
       * @param {string} nameAndArgs - command name and arguments, args are `<required>` or `[optional]` and last may also be `variadic...`
       * @param {(object | string)} [actionOptsOrExecDesc] - configuration options (for action), or description (for executable)
       * @param {object} [execOpts] - configuration options (for executable)
       * @return {Command} returns new command for action handler, or `this` for executable command
       */
      command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
        let desc = actionOptsOrExecDesc;
        let opts = execOpts;
        if (typeof desc === "object" && desc !== null) {
          opts = desc;
          desc = null;
        }
        opts = opts || {};
        const [, name2, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
        const cmd = this.createCommand(name2);
        if (desc) {
          cmd.description(desc);
          cmd._executableHandler = true;
        }
        if (opts.isDefault) this._defaultCommandName = cmd._name;
        cmd._hidden = !!(opts.noHelp || opts.hidden);
        cmd._executableFile = opts.executableFile || null;
        if (args) cmd.arguments(args);
        this._registerCommand(cmd);
        cmd.parent = this;
        cmd.copyInheritedSettings(this);
        if (desc) return this;
        return cmd;
      }
      /**
       * Factory routine to create a new unattached command.
       *
       * See .command() for creating an attached subcommand, which uses this routine to
       * create the command. You can override createCommand to customise subcommands.
       *
       * @param {string} [name]
       * @return {Command} new command
       */
      createCommand(name2) {
        return new _Command(name2);
      }
      /**
       * You can customise the help with a subclass of Help by overriding createHelp,
       * or by overriding Help properties using configureHelp().
       *
       * @return {Help}
       */
      createHelp() {
        return Object.assign(new Help2(), this.configureHelp());
      }
      /**
       * You can customise the help by overriding Help properties using configureHelp(),
       * or with a subclass of Help by overriding createHelp().
       *
       * @param {object} [configuration] - configuration options
       * @return {(Command | object)} `this` command for chaining, or stored configuration
       */
      configureHelp(configuration) {
        if (configuration === void 0) return this._helpConfiguration;
        this._helpConfiguration = configuration;
        return this;
      }
      /**
       * The default output goes to stdout and stderr. You can customise this for special
       * applications. You can also customise the display of errors by overriding outputError.
       *
       * The configuration properties are all functions:
       *
       *     // change how output being written, defaults to stdout and stderr
       *     writeOut(str)
       *     writeErr(str)
       *     // change how output being written for errors, defaults to writeErr
       *     outputError(str, write) // used for displaying errors and not used for displaying help
       *     // specify width for wrapping help
       *     getOutHelpWidth()
       *     getErrHelpWidth()
       *     // color support, currently only used with Help
       *     getOutHasColors()
       *     getErrHasColors()
       *     stripColor() // used to remove ANSI escape codes if output does not have colors
       *
       * @param {object} [configuration] - configuration options
       * @return {(Command | object)} `this` command for chaining, or stored configuration
       */
      configureOutput(configuration) {
        if (configuration === void 0) return this._outputConfiguration;
        Object.assign(this._outputConfiguration, configuration);
        return this;
      }
      /**
       * Display the help or a custom message after an error occurs.
       *
       * @param {(boolean|string)} [displayHelp]
       * @return {Command} `this` command for chaining
       */
      showHelpAfterError(displayHelp = true) {
        if (typeof displayHelp !== "string") displayHelp = !!displayHelp;
        this._showHelpAfterError = displayHelp;
        return this;
      }
      /**
       * Display suggestion of similar commands for unknown commands, or options for unknown options.
       *
       * @param {boolean} [displaySuggestion]
       * @return {Command} `this` command for chaining
       */
      showSuggestionAfterError(displaySuggestion = true) {
        this._showSuggestionAfterError = !!displaySuggestion;
        return this;
      }
      /**
       * Add a prepared subcommand.
       *
       * See .command() for creating an attached subcommand which inherits settings from its parent.
       *
       * @param {Command} cmd - new subcommand
       * @param {object} [opts] - configuration options
       * @return {Command} `this` command for chaining
       */
      addCommand(cmd, opts) {
        if (!cmd._name) {
          throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
        }
        opts = opts || {};
        if (opts.isDefault) this._defaultCommandName = cmd._name;
        if (opts.noHelp || opts.hidden) cmd._hidden = true;
        this._registerCommand(cmd);
        cmd.parent = this;
        cmd._checkForBrokenPassThrough();
        return this;
      }
      /**
       * Factory routine to create a new unattached argument.
       *
       * See .argument() for creating an attached argument, which uses this routine to
       * create the argument. You can override createArgument to return a custom argument.
       *
       * @param {string} name
       * @param {string} [description]
       * @return {Argument} new argument
       */
      createArgument(name2, description) {
        return new Argument2(name2, description);
      }
      /**
       * Define argument syntax for command.
       *
       * The default is that the argument is required, and you can explicitly
       * indicate this with <> around the name. Put [] around the name for an optional argument.
       *
       * @example
       * program.argument('<input-file>');
       * program.argument('[output-file]');
       *
       * @param {string} name
       * @param {string} [description]
       * @param {(Function|*)} [fn] - custom argument processing function
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      argument(name2, description, fn, defaultValue) {
        const argument = this.createArgument(name2, description);
        if (typeof fn === "function") {
          argument.default(defaultValue).argParser(fn);
        } else {
          argument.default(fn);
        }
        this.addArgument(argument);
        return this;
      }
      /**
       * Define argument syntax for command, adding multiple at once (without descriptions).
       *
       * See also .argument().
       *
       * @example
       * program.arguments('<cmd> [env]');
       *
       * @param {string} names
       * @return {Command} `this` command for chaining
       */
      arguments(names) {
        names.trim().split(/ +/).forEach((detail) => {
          this.argument(detail);
        });
        return this;
      }
      /**
       * Define argument syntax for command, adding a prepared argument.
       *
       * @param {Argument} argument
       * @return {Command} `this` command for chaining
       */
      addArgument(argument) {
        const previousArgument = this.registeredArguments.slice(-1)[0];
        if (previousArgument && previousArgument.variadic) {
          throw new Error(
            `only the last argument can be variadic '${previousArgument.name()}'`
          );
        }
        if (argument.required && argument.defaultValue !== void 0 && argument.parseArg === void 0) {
          throw new Error(
            `a default value for a required argument is never used: '${argument.name()}'`
          );
        }
        this.registeredArguments.push(argument);
        return this;
      }
      /**
       * Customise or override default help command. By default a help command is automatically added if your command has subcommands.
       *
       * @example
       *    program.helpCommand('help [cmd]');
       *    program.helpCommand('help [cmd]', 'show help');
       *    program.helpCommand(false); // suppress default help command
       *    program.helpCommand(true); // add help command even if no subcommands
       *
       * @param {string|boolean} enableOrNameAndArgs - enable with custom name and/or arguments, or boolean to override whether added
       * @param {string} [description] - custom description
       * @return {Command} `this` command for chaining
       */
      helpCommand(enableOrNameAndArgs, description) {
        if (typeof enableOrNameAndArgs === "boolean") {
          this._addImplicitHelpCommand = enableOrNameAndArgs;
          return this;
        }
        enableOrNameAndArgs = enableOrNameAndArgs ?? "help [command]";
        const [, helpName, helpArgs] = enableOrNameAndArgs.match(/([^ ]+) *(.*)/);
        const helpDescription = description ?? "display help for command";
        const helpCommand = this.createCommand(helpName);
        helpCommand.helpOption(false);
        if (helpArgs) helpCommand.arguments(helpArgs);
        if (helpDescription) helpCommand.description(helpDescription);
        this._addImplicitHelpCommand = true;
        this._helpCommand = helpCommand;
        return this;
      }
      /**
       * Add prepared custom help command.
       *
       * @param {(Command|string|boolean)} helpCommand - custom help command, or deprecated enableOrNameAndArgs as for `.helpCommand()`
       * @param {string} [deprecatedDescription] - deprecated custom description used with custom name only
       * @return {Command} `this` command for chaining
       */
      addHelpCommand(helpCommand, deprecatedDescription) {
        if (typeof helpCommand !== "object") {
          this.helpCommand(helpCommand, deprecatedDescription);
          return this;
        }
        this._addImplicitHelpCommand = true;
        this._helpCommand = helpCommand;
        return this;
      }
      /**
       * Lazy create help command.
       *
       * @return {(Command|null)}
       * @package
       */
      _getHelpCommand() {
        const hasImplicitHelpCommand = this._addImplicitHelpCommand ?? (this.commands.length && !this._actionHandler && !this._findCommand("help"));
        if (hasImplicitHelpCommand) {
          if (this._helpCommand === void 0) {
            this.helpCommand(void 0, void 0);
          }
          return this._helpCommand;
        }
        return null;
      }
      /**
       * Add hook for life cycle event.
       *
       * @param {string} event
       * @param {Function} listener
       * @return {Command} `this` command for chaining
       */
      hook(event, listener) {
        const allowedValues = ["preSubcommand", "preAction", "postAction"];
        if (!allowedValues.includes(event)) {
          throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
        }
        if (this._lifeCycleHooks[event]) {
          this._lifeCycleHooks[event].push(listener);
        } else {
          this._lifeCycleHooks[event] = [listener];
        }
        return this;
      }
      /**
       * Register callback to use as replacement for calling process.exit.
       *
       * @param {Function} [fn] optional callback which will be passed a CommanderError, defaults to throwing
       * @return {Command} `this` command for chaining
       */
      exitOverride(fn) {
        if (fn) {
          this._exitCallback = fn;
        } else {
          this._exitCallback = (err) => {
            if (err.code !== "commander.executeSubCommandAsync") {
              throw err;
            } else {
            }
          };
        }
        return this;
      }
      /**
       * Call process.exit, and _exitCallback if defined.
       *
       * @param {number} exitCode exit code for using with process.exit
       * @param {string} code an id string representing the error
       * @param {string} message human-readable description of the error
       * @return never
       * @private
       */
      _exit(exitCode, code, message) {
        if (this._exitCallback) {
          this._exitCallback(new CommanderError2(exitCode, code, message));
        }
        process2.exit(exitCode);
      }
      /**
       * Register callback `fn` for the command.
       *
       * @example
       * program
       *   .command('serve')
       *   .description('start service')
       *   .action(function() {
       *      // do work here
       *   });
       *
       * @param {Function} fn
       * @return {Command} `this` command for chaining
       */
      action(fn) {
        const listener = (args) => {
          const expectedArgsCount = this.registeredArguments.length;
          const actionArgs = args.slice(0, expectedArgsCount);
          if (this._storeOptionsAsProperties) {
            actionArgs[expectedArgsCount] = this;
          } else {
            actionArgs[expectedArgsCount] = this.opts();
          }
          actionArgs.push(this);
          return fn.apply(this, actionArgs);
        };
        this._actionHandler = listener;
        return this;
      }
      /**
       * Factory routine to create a new unattached option.
       *
       * See .option() for creating an attached option, which uses this routine to
       * create the option. You can override createOption to return a custom option.
       *
       * @param {string} flags
       * @param {string} [description]
       * @return {Option} new option
       */
      createOption(flags, description) {
        return new Option2(flags, description);
      }
      /**
       * Wrap parseArgs to catch 'commander.invalidArgument'.
       *
       * @param {(Option | Argument)} target
       * @param {string} value
       * @param {*} previous
       * @param {string} invalidArgumentMessage
       * @private
       */
      _callParseArg(target, value, previous, invalidArgumentMessage) {
        try {
          return target.parseArg(value, previous);
        } catch (err) {
          if (err.code === "commander.invalidArgument") {
            const message = `${invalidArgumentMessage} ${err.message}`;
            this.error(message, { exitCode: err.exitCode, code: err.code });
          }
          throw err;
        }
      }
      /**
       * Check for option flag conflicts.
       * Register option if no conflicts found, or throw on conflict.
       *
       * @param {Option} option
       * @private
       */
      _registerOption(option) {
        const matchingOption = option.short && this._findOption(option.short) || option.long && this._findOption(option.long);
        if (matchingOption) {
          const matchingFlag = option.long && this._findOption(option.long) ? option.long : option.short;
          throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
        }
        this.options.push(option);
      }
      /**
       * Check for command name and alias conflicts with existing commands.
       * Register command if no conflicts found, or throw on conflict.
       *
       * @param {Command} command
       * @private
       */
      _registerCommand(command) {
        const knownBy = (cmd) => {
          return [cmd.name()].concat(cmd.aliases());
        };
        const alreadyUsed = knownBy(command).find(
          (name2) => this._findCommand(name2)
        );
        if (alreadyUsed) {
          const existingCmd = knownBy(this._findCommand(alreadyUsed)).join("|");
          const newCmd = knownBy(command).join("|");
          throw new Error(
            `cannot add command '${newCmd}' as already have command '${existingCmd}'`
          );
        }
        this.commands.push(command);
      }
      /**
       * Add an option.
       *
       * @param {Option} option
       * @return {Command} `this` command for chaining
       */
      addOption(option) {
        this._registerOption(option);
        const oname = option.name();
        const name2 = option.attributeName();
        if (option.negate) {
          const positiveLongFlag = option.long.replace(/^--no-/, "--");
          if (!this._findOption(positiveLongFlag)) {
            this.setOptionValueWithSource(
              name2,
              option.defaultValue === void 0 ? true : option.defaultValue,
              "default"
            );
          }
        } else if (option.defaultValue !== void 0) {
          this.setOptionValueWithSource(name2, option.defaultValue, "default");
        }
        const handleOptionValue = (val, invalidValueMessage, valueSource) => {
          if (val == null && option.presetArg !== void 0) {
            val = option.presetArg;
          }
          const oldValue = this.getOptionValue(name2);
          if (val !== null && option.parseArg) {
            val = this._callParseArg(option, val, oldValue, invalidValueMessage);
          } else if (val !== null && option.variadic) {
            val = option._concatValue(val, oldValue);
          }
          if (val == null) {
            if (option.negate) {
              val = false;
            } else if (option.isBoolean() || option.optional) {
              val = true;
            } else {
              val = "";
            }
          }
          this.setOptionValueWithSource(name2, val, valueSource);
        };
        this.on("option:" + oname, (val) => {
          const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
          handleOptionValue(val, invalidValueMessage, "cli");
        });
        if (option.envVar) {
          this.on("optionEnv:" + oname, (val) => {
            const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
            handleOptionValue(val, invalidValueMessage, "env");
          });
        }
        return this;
      }
      /**
       * Internal implementation shared by .option() and .requiredOption()
       *
       * @return {Command} `this` command for chaining
       * @private
       */
      _optionEx(config2, flags, description, fn, defaultValue) {
        if (typeof flags === "object" && flags instanceof Option2) {
          throw new Error(
            "To add an Option object use addOption() instead of option() or requiredOption()"
          );
        }
        const option = this.createOption(flags, description);
        option.makeOptionMandatory(!!config2.mandatory);
        if (typeof fn === "function") {
          option.default(defaultValue).argParser(fn);
        } else if (fn instanceof RegExp) {
          const regex = fn;
          fn = (val, def) => {
            const m = regex.exec(val);
            return m ? m[0] : def;
          };
          option.default(defaultValue).argParser(fn);
        } else {
          option.default(fn);
        }
        return this.addOption(option);
      }
      /**
       * Define option with `flags`, `description`, and optional argument parsing function or `defaultValue` or both.
       *
       * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space. A required
       * option-argument is indicated by `<>` and an optional option-argument by `[]`.
       *
       * See the README for more details, and see also addOption() and requiredOption().
       *
       * @example
       * program
       *     .option('-p, --pepper', 'add pepper')
       *     .option('--pt, --pizza-type <TYPE>', 'type of pizza') // required option-argument
       *     .option('-c, --cheese [CHEESE]', 'add extra cheese', 'mozzarella') // optional option-argument with default
       *     .option('-t, --tip <VALUE>', 'add tip to purchase cost', parseFloat) // custom parse function
       *
       * @param {string} flags
       * @param {string} [description]
       * @param {(Function|*)} [parseArg] - custom option processing function or default value
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      option(flags, description, parseArg, defaultValue) {
        return this._optionEx({}, flags, description, parseArg, defaultValue);
      }
      /**
       * Add a required option which must have a value after parsing. This usually means
       * the option must be specified on the command line. (Otherwise the same as .option().)
       *
       * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space.
       *
       * @param {string} flags
       * @param {string} [description]
       * @param {(Function|*)} [parseArg] - custom option processing function or default value
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      requiredOption(flags, description, parseArg, defaultValue) {
        return this._optionEx(
          { mandatory: true },
          flags,
          description,
          parseArg,
          defaultValue
        );
      }
      /**
       * Alter parsing of short flags with optional values.
       *
       * @example
       * // for `.option('-f,--flag [value]'):
       * program.combineFlagAndOptionalValue(true);  // `-f80` is treated like `--flag=80`, this is the default behaviour
       * program.combineFlagAndOptionalValue(false) // `-fb` is treated like `-f -b`
       *
       * @param {boolean} [combine] - if `true` or omitted, an optional value can be specified directly after the flag.
       * @return {Command} `this` command for chaining
       */
      combineFlagAndOptionalValue(combine = true) {
        this._combineFlagAndOptionalValue = !!combine;
        return this;
      }
      /**
       * Allow unknown options on the command line.
       *
       * @param {boolean} [allowUnknown] - if `true` or omitted, no error will be thrown for unknown options.
       * @return {Command} `this` command for chaining
       */
      allowUnknownOption(allowUnknown = true) {
        this._allowUnknownOption = !!allowUnknown;
        return this;
      }
      /**
       * Allow excess command-arguments on the command line. Pass false to make excess arguments an error.
       *
       * @param {boolean} [allowExcess] - if `true` or omitted, no error will be thrown for excess arguments.
       * @return {Command} `this` command for chaining
       */
      allowExcessArguments(allowExcess = true) {
        this._allowExcessArguments = !!allowExcess;
        return this;
      }
      /**
       * Enable positional options. Positional means global options are specified before subcommands which lets
       * subcommands reuse the same option names, and also enables subcommands to turn on passThroughOptions.
       * The default behaviour is non-positional and global options may appear anywhere on the command line.
       *
       * @param {boolean} [positional]
       * @return {Command} `this` command for chaining
       */
      enablePositionalOptions(positional = true) {
        this._enablePositionalOptions = !!positional;
        return this;
      }
      /**
       * Pass through options that come after command-arguments rather than treat them as command-options,
       * so actual command-options come before command-arguments. Turning this on for a subcommand requires
       * positional options to have been enabled on the program (parent commands).
       * The default behaviour is non-positional and options may appear before or after command-arguments.
       *
       * @param {boolean} [passThrough] for unknown options.
       * @return {Command} `this` command for chaining
       */
      passThroughOptions(passThrough = true) {
        this._passThroughOptions = !!passThrough;
        this._checkForBrokenPassThrough();
        return this;
      }
      /**
       * @private
       */
      _checkForBrokenPassThrough() {
        if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) {
          throw new Error(
            `passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`
          );
        }
      }
      /**
       * Whether to store option values as properties on command object,
       * or store separately (specify false). In both cases the option values can be accessed using .opts().
       *
       * @param {boolean} [storeAsProperties=true]
       * @return {Command} `this` command for chaining
       */
      storeOptionsAsProperties(storeAsProperties = true) {
        if (this.options.length) {
          throw new Error("call .storeOptionsAsProperties() before adding options");
        }
        if (Object.keys(this._optionValues).length) {
          throw new Error(
            "call .storeOptionsAsProperties() before setting option values"
          );
        }
        this._storeOptionsAsProperties = !!storeAsProperties;
        return this;
      }
      /**
       * Retrieve option value.
       *
       * @param {string} key
       * @return {object} value
       */
      getOptionValue(key) {
        if (this._storeOptionsAsProperties) {
          return this[key];
        }
        return this._optionValues[key];
      }
      /**
       * Store option value.
       *
       * @param {string} key
       * @param {object} value
       * @return {Command} `this` command for chaining
       */
      setOptionValue(key, value) {
        return this.setOptionValueWithSource(key, value, void 0);
      }
      /**
       * Store option value and where the value came from.
       *
       * @param {string} key
       * @param {object} value
       * @param {string} source - expected values are default/config/env/cli/implied
       * @return {Command} `this` command for chaining
       */
      setOptionValueWithSource(key, value, source) {
        if (this._storeOptionsAsProperties) {
          this[key] = value;
        } else {
          this._optionValues[key] = value;
        }
        this._optionValueSources[key] = source;
        return this;
      }
      /**
       * Get source of option value.
       * Expected values are default | config | env | cli | implied
       *
       * @param {string} key
       * @return {string}
       */
      getOptionValueSource(key) {
        return this._optionValueSources[key];
      }
      /**
       * Get source of option value. See also .optsWithGlobals().
       * Expected values are default | config | env | cli | implied
       *
       * @param {string} key
       * @return {string}
       */
      getOptionValueSourceWithGlobals(key) {
        let source;
        this._getCommandAndAncestors().forEach((cmd) => {
          if (cmd.getOptionValueSource(key) !== void 0) {
            source = cmd.getOptionValueSource(key);
          }
        });
        return source;
      }
      /**
       * Get user arguments from implied or explicit arguments.
       * Side-effects: set _scriptPath if args included script. Used for default program name, and subcommand searches.
       *
       * @private
       */
      _prepareUserArgs(argv, parseOptions) {
        if (argv !== void 0 && !Array.isArray(argv)) {
          throw new Error("first parameter to parse must be array or undefined");
        }
        parseOptions = parseOptions || {};
        if (argv === void 0 && parseOptions.from === void 0) {
          if (process2.versions?.electron) {
            parseOptions.from = "electron";
          }
          const execArgv = process2.execArgv ?? [];
          if (execArgv.includes("-e") || execArgv.includes("--eval") || execArgv.includes("-p") || execArgv.includes("--print")) {
            parseOptions.from = "eval";
          }
        }
        if (argv === void 0) {
          argv = process2.argv;
        }
        this.rawArgs = argv.slice();
        let userArgs;
        switch (parseOptions.from) {
          case void 0:
          case "node":
            this._scriptPath = argv[1];
            userArgs = argv.slice(2);
            break;
          case "electron":
            if (process2.defaultApp) {
              this._scriptPath = argv[1];
              userArgs = argv.slice(2);
            } else {
              userArgs = argv.slice(1);
            }
            break;
          case "user":
            userArgs = argv.slice(0);
            break;
          case "eval":
            userArgs = argv.slice(1);
            break;
          default:
            throw new Error(
              `unexpected parse option { from: '${parseOptions.from}' }`
            );
        }
        if (!this._name && this._scriptPath)
          this.nameFromFilename(this._scriptPath);
        this._name = this._name || "program";
        return userArgs;
      }
      /**
       * Parse `argv`, setting options and invoking commands when defined.
       *
       * Use parseAsync instead of parse if any of your action handlers are async.
       *
       * Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
       *
       * Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
       * - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
       * - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
       * - `'user'`: just user arguments
       *
       * @example
       * program.parse(); // parse process.argv and auto-detect electron and special node flags
       * program.parse(process.argv); // assume argv[0] is app and argv[1] is script
       * program.parse(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
       *
       * @param {string[]} [argv] - optional, defaults to process.argv
       * @param {object} [parseOptions] - optionally specify style of options with from: node/user/electron
       * @param {string} [parseOptions.from] - where the args are from: 'node', 'user', 'electron'
       * @return {Command} `this` command for chaining
       */
      parse(argv, parseOptions) {
        this._prepareForParse();
        const userArgs = this._prepareUserArgs(argv, parseOptions);
        this._parseCommand([], userArgs);
        return this;
      }
      /**
       * Parse `argv`, setting options and invoking commands when defined.
       *
       * Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
       *
       * Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
       * - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
       * - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
       * - `'user'`: just user arguments
       *
       * @example
       * await program.parseAsync(); // parse process.argv and auto-detect electron and special node flags
       * await program.parseAsync(process.argv); // assume argv[0] is app and argv[1] is script
       * await program.parseAsync(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
       *
       * @param {string[]} [argv]
       * @param {object} [parseOptions]
       * @param {string} parseOptions.from - where the args are from: 'node', 'user', 'electron'
       * @return {Promise}
       */
      async parseAsync(argv, parseOptions) {
        this._prepareForParse();
        const userArgs = this._prepareUserArgs(argv, parseOptions);
        await this._parseCommand([], userArgs);
        return this;
      }
      _prepareForParse() {
        if (this._savedState === null) {
          this.saveStateBeforeParse();
        } else {
          this.restoreStateBeforeParse();
        }
      }
      /**
       * Called the first time parse is called to save state and allow a restore before subsequent calls to parse.
       * Not usually called directly, but available for subclasses to save their custom state.
       *
       * This is called in a lazy way. Only commands used in parsing chain will have state saved.
       */
      saveStateBeforeParse() {
        this._savedState = {
          // name is stable if supplied by author, but may be unspecified for root command and deduced during parsing
          _name: this._name,
          // option values before parse have default values (including false for negated options)
          // shallow clones
          _optionValues: { ...this._optionValues },
          _optionValueSources: { ...this._optionValueSources }
        };
      }
      /**
       * Restore state before parse for calls after the first.
       * Not usually called directly, but available for subclasses to save their custom state.
       *
       * This is called in a lazy way. Only commands used in parsing chain will have state restored.
       */
      restoreStateBeforeParse() {
        if (this._storeOptionsAsProperties)
          throw new Error(`Can not call parse again when storeOptionsAsProperties is true.
- either make a new Command for each call to parse, or stop storing options as properties`);
        this._name = this._savedState._name;
        this._scriptPath = null;
        this.rawArgs = [];
        this._optionValues = { ...this._savedState._optionValues };
        this._optionValueSources = { ...this._savedState._optionValueSources };
        this.args = [];
        this.processedArgs = [];
      }
      /**
       * Throw if expected executable is missing. Add lots of help for author.
       *
       * @param {string} executableFile
       * @param {string} executableDir
       * @param {string} subcommandName
       */
      _checkForMissingExecutable(executableFile, executableDir, subcommandName) {
        if (fs.existsSync(executableFile)) return;
        const executableDirMessage = executableDir ? `searched for local subcommand relative to directory '${executableDir}'` : "no directory for search for local subcommand, use .executableDir() to supply a custom directory";
        const executableMissing = `'${executableFile}' does not exist
 - if '${subcommandName}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
        throw new Error(executableMissing);
      }
      /**
       * Execute a sub-command executable.
       *
       * @private
       */
      _executeSubCommand(subcommand, args) {
        args = args.slice();
        let launchWithNode = false;
        const sourceExt = [".js", ".ts", ".tsx", ".mjs", ".cjs"];
        function findFile(baseDir, baseName) {
          const localBin = path.resolve(baseDir, baseName);
          if (fs.existsSync(localBin)) return localBin;
          if (sourceExt.includes(path.extname(baseName))) return void 0;
          const foundExt = sourceExt.find(
            (ext) => fs.existsSync(`${localBin}${ext}`)
          );
          if (foundExt) return `${localBin}${foundExt}`;
          return void 0;
        }
        this._checkForMissingMandatoryOptions();
        this._checkForConflictingOptions();
        let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
        let executableDir = this._executableDir || "";
        if (this._scriptPath) {
          let resolvedScriptPath;
          try {
            resolvedScriptPath = fs.realpathSync(this._scriptPath);
          } catch {
            resolvedScriptPath = this._scriptPath;
          }
          executableDir = path.resolve(
            path.dirname(resolvedScriptPath),
            executableDir
          );
        }
        if (executableDir) {
          let localFile = findFile(executableDir, executableFile);
          if (!localFile && !subcommand._executableFile && this._scriptPath) {
            const legacyName = path.basename(
              this._scriptPath,
              path.extname(this._scriptPath)
            );
            if (legacyName !== this._name) {
              localFile = findFile(
                executableDir,
                `${legacyName}-${subcommand._name}`
              );
            }
          }
          executableFile = localFile || executableFile;
        }
        launchWithNode = sourceExt.includes(path.extname(executableFile));
        let proc;
        if (process2.platform !== "win32") {
          if (launchWithNode) {
            args.unshift(executableFile);
            args = incrementNodeInspectorPort(process2.execArgv).concat(args);
            proc = childProcess.spawn(process2.argv[0], args, { stdio: "inherit" });
          } else {
            proc = childProcess.spawn(executableFile, args, { stdio: "inherit" });
          }
        } else {
          this._checkForMissingExecutable(
            executableFile,
            executableDir,
            subcommand._name
          );
          args.unshift(executableFile);
          args = incrementNodeInspectorPort(process2.execArgv).concat(args);
          proc = childProcess.spawn(process2.execPath, args, { stdio: "inherit" });
        }
        if (!proc.killed) {
          const signals = ["SIGUSR1", "SIGUSR2", "SIGTERM", "SIGINT", "SIGHUP"];
          signals.forEach((signal) => {
            process2.on(signal, () => {
              if (proc.killed === false && proc.exitCode === null) {
                proc.kill(signal);
              }
            });
          });
        }
        const exitCallback = this._exitCallback;
        proc.on("close", (code) => {
          code = code ?? 1;
          if (!exitCallback) {
            process2.exit(code);
          } else {
            exitCallback(
              new CommanderError2(
                code,
                "commander.executeSubCommandAsync",
                "(close)"
              )
            );
          }
        });
        proc.on("error", (err) => {
          if (err.code === "ENOENT") {
            this._checkForMissingExecutable(
              executableFile,
              executableDir,
              subcommand._name
            );
          } else if (err.code === "EACCES") {
            throw new Error(`'${executableFile}' not executable`);
          }
          if (!exitCallback) {
            process2.exit(1);
          } else {
            const wrappedError = new CommanderError2(
              1,
              "commander.executeSubCommandAsync",
              "(error)"
            );
            wrappedError.nestedError = err;
            exitCallback(wrappedError);
          }
        });
        this.runningCommand = proc;
      }
      /**
       * @private
       */
      _dispatchSubcommand(commandName, operands, unknown) {
        const subCommand = this._findCommand(commandName);
        if (!subCommand) this.help({ error: true });
        subCommand._prepareForParse();
        let promiseChain;
        promiseChain = this._chainOrCallSubCommandHook(
          promiseChain,
          subCommand,
          "preSubcommand"
        );
        promiseChain = this._chainOrCall(promiseChain, () => {
          if (subCommand._executableHandler) {
            this._executeSubCommand(subCommand, operands.concat(unknown));
          } else {
            return subCommand._parseCommand(operands, unknown);
          }
        });
        return promiseChain;
      }
      /**
       * Invoke help directly if possible, or dispatch if necessary.
       * e.g. help foo
       *
       * @private
       */
      _dispatchHelpCommand(subcommandName) {
        if (!subcommandName) {
          this.help();
        }
        const subCommand = this._findCommand(subcommandName);
        if (subCommand && !subCommand._executableHandler) {
          subCommand.help();
        }
        return this._dispatchSubcommand(
          subcommandName,
          [],
          [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? "--help"]
        );
      }
      /**
       * Check this.args against expected this.registeredArguments.
       *
       * @private
       */
      _checkNumberOfArguments() {
        this.registeredArguments.forEach((arg, i2) => {
          if (arg.required && this.args[i2] == null) {
            this.missingArgument(arg.name());
          }
        });
        if (this.registeredArguments.length > 0 && this.registeredArguments[this.registeredArguments.length - 1].variadic) {
          return;
        }
        if (this.args.length > this.registeredArguments.length) {
          this._excessArguments(this.args);
        }
      }
      /**
       * Process this.args using this.registeredArguments and save as this.processedArgs!
       *
       * @private
       */
      _processArguments() {
        const myParseArg = (argument, value, previous) => {
          let parsedValue = value;
          if (value !== null && argument.parseArg) {
            const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
            parsedValue = this._callParseArg(
              argument,
              value,
              previous,
              invalidValueMessage
            );
          }
          return parsedValue;
        };
        this._checkNumberOfArguments();
        const processedArgs = [];
        this.registeredArguments.forEach((declaredArg, index) => {
          let value = declaredArg.defaultValue;
          if (declaredArg.variadic) {
            if (index < this.args.length) {
              value = this.args.slice(index);
              if (declaredArg.parseArg) {
                value = value.reduce((processed, v) => {
                  return myParseArg(declaredArg, v, processed);
                }, declaredArg.defaultValue);
              }
            } else if (value === void 0) {
              value = [];
            }
          } else if (index < this.args.length) {
            value = this.args[index];
            if (declaredArg.parseArg) {
              value = myParseArg(declaredArg, value, declaredArg.defaultValue);
            }
          }
          processedArgs[index] = value;
        });
        this.processedArgs = processedArgs;
      }
      /**
       * Once we have a promise we chain, but call synchronously until then.
       *
       * @param {(Promise|undefined)} promise
       * @param {Function} fn
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCall(promise, fn) {
        if (promise && promise.then && typeof promise.then === "function") {
          return promise.then(() => fn());
        }
        return fn();
      }
      /**
       *
       * @param {(Promise|undefined)} promise
       * @param {string} event
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCallHooks(promise, event) {
        let result = promise;
        const hooks = [];
        this._getCommandAndAncestors().reverse().filter((cmd) => cmd._lifeCycleHooks[event] !== void 0).forEach((hookedCommand) => {
          hookedCommand._lifeCycleHooks[event].forEach((callback) => {
            hooks.push({ hookedCommand, callback });
          });
        });
        if (event === "postAction") {
          hooks.reverse();
        }
        hooks.forEach((hookDetail) => {
          result = this._chainOrCall(result, () => {
            return hookDetail.callback(hookDetail.hookedCommand, this);
          });
        });
        return result;
      }
      /**
       *
       * @param {(Promise|undefined)} promise
       * @param {Command} subCommand
       * @param {string} event
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCallSubCommandHook(promise, subCommand, event) {
        let result = promise;
        if (this._lifeCycleHooks[event] !== void 0) {
          this._lifeCycleHooks[event].forEach((hook) => {
            result = this._chainOrCall(result, () => {
              return hook(this, subCommand);
            });
          });
        }
        return result;
      }
      /**
       * Process arguments in context of this command.
       * Returns action result, in case it is a promise.
       *
       * @private
       */
      _parseCommand(operands, unknown) {
        const parsed = this.parseOptions(unknown);
        this._parseOptionsEnv();
        this._parseOptionsImplied();
        operands = operands.concat(parsed.operands);
        unknown = parsed.unknown;
        this.args = operands.concat(unknown);
        if (operands && this._findCommand(operands[0])) {
          return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
        }
        if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) {
          return this._dispatchHelpCommand(operands[1]);
        }
        if (this._defaultCommandName) {
          this._outputHelpIfRequested(unknown);
          return this._dispatchSubcommand(
            this._defaultCommandName,
            operands,
            unknown
          );
        }
        if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
          this.help({ error: true });
        }
        this._outputHelpIfRequested(parsed.unknown);
        this._checkForMissingMandatoryOptions();
        this._checkForConflictingOptions();
        const checkForUnknownOptions = () => {
          if (parsed.unknown.length > 0) {
            this.unknownOption(parsed.unknown[0]);
          }
        };
        const commandEvent = `command:${this.name()}`;
        if (this._actionHandler) {
          checkForUnknownOptions();
          this._processArguments();
          let promiseChain;
          promiseChain = this._chainOrCallHooks(promiseChain, "preAction");
          promiseChain = this._chainOrCall(
            promiseChain,
            () => this._actionHandler(this.processedArgs)
          );
          if (this.parent) {
            promiseChain = this._chainOrCall(promiseChain, () => {
              this.parent.emit(commandEvent, operands, unknown);
            });
          }
          promiseChain = this._chainOrCallHooks(promiseChain, "postAction");
          return promiseChain;
        }
        if (this.parent && this.parent.listenerCount(commandEvent)) {
          checkForUnknownOptions();
          this._processArguments();
          this.parent.emit(commandEvent, operands, unknown);
        } else if (operands.length) {
          if (this._findCommand("*")) {
            return this._dispatchSubcommand("*", operands, unknown);
          }
          if (this.listenerCount("command:*")) {
            this.emit("command:*", operands, unknown);
          } else if (this.commands.length) {
            this.unknownCommand();
          } else {
            checkForUnknownOptions();
            this._processArguments();
          }
        } else if (this.commands.length) {
          checkForUnknownOptions();
          this.help({ error: true });
        } else {
          checkForUnknownOptions();
          this._processArguments();
        }
      }
      /**
       * Find matching command.
       *
       * @private
       * @return {Command | undefined}
       */
      _findCommand(name2) {
        if (!name2) return void 0;
        return this.commands.find(
          (cmd) => cmd._name === name2 || cmd._aliases.includes(name2)
        );
      }
      /**
       * Return an option matching `arg` if any.
       *
       * @param {string} arg
       * @return {Option}
       * @package
       */
      _findOption(arg) {
        return this.options.find((option) => option.is(arg));
      }
      /**
       * Display an error message if a mandatory option does not have a value.
       * Called after checking for help flags in leaf subcommand.
       *
       * @private
       */
      _checkForMissingMandatoryOptions() {
        this._getCommandAndAncestors().forEach((cmd) => {
          cmd.options.forEach((anOption) => {
            if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === void 0) {
              cmd.missingMandatoryOptionValue(anOption);
            }
          });
        });
      }
      /**
       * Display an error message if conflicting options are used together in this.
       *
       * @private
       */
      _checkForConflictingLocalOptions() {
        const definedNonDefaultOptions = this.options.filter((option) => {
          const optionKey = option.attributeName();
          if (this.getOptionValue(optionKey) === void 0) {
            return false;
          }
          return this.getOptionValueSource(optionKey) !== "default";
        });
        const optionsWithConflicting = definedNonDefaultOptions.filter(
          (option) => option.conflictsWith.length > 0
        );
        optionsWithConflicting.forEach((option) => {
          const conflictingAndDefined = definedNonDefaultOptions.find(
            (defined) => option.conflictsWith.includes(defined.attributeName())
          );
          if (conflictingAndDefined) {
            this._conflictingOption(option, conflictingAndDefined);
          }
        });
      }
      /**
       * Display an error message if conflicting options are used together.
       * Called after checking for help flags in leaf subcommand.
       *
       * @private
       */
      _checkForConflictingOptions() {
        this._getCommandAndAncestors().forEach((cmd) => {
          cmd._checkForConflictingLocalOptions();
        });
      }
      /**
       * Parse options from `argv` removing known options,
       * and return argv split into operands and unknown arguments.
       *
       * Side effects: modifies command by storing options. Does not reset state if called again.
       *
       * Examples:
       *
       *     argv => operands, unknown
       *     --known kkk op => [op], []
       *     op --known kkk => [op], []
       *     sub --unknown uuu op => [sub], [--unknown uuu op]
       *     sub -- --unknown uuu op => [sub --unknown uuu op], []
       *
       * @param {string[]} argv
       * @return {{operands: string[], unknown: string[]}}
       */
      parseOptions(argv) {
        const operands = [];
        const unknown = [];
        let dest = operands;
        const args = argv.slice();
        function maybeOption(arg) {
          return arg.length > 1 && arg[0] === "-";
        }
        let activeVariadicOption = null;
        while (args.length) {
          const arg = args.shift();
          if (arg === "--") {
            if (dest === unknown) dest.push(arg);
            dest.push(...args);
            break;
          }
          if (activeVariadicOption && !maybeOption(arg)) {
            this.emit(`option:${activeVariadicOption.name()}`, arg);
            continue;
          }
          activeVariadicOption = null;
          if (maybeOption(arg)) {
            const option = this._findOption(arg);
            if (option) {
              if (option.required) {
                const value = args.shift();
                if (value === void 0) this.optionMissingArgument(option);
                this.emit(`option:${option.name()}`, value);
              } else if (option.optional) {
                let value = null;
                if (args.length > 0 && !maybeOption(args[0])) {
                  value = args.shift();
                }
                this.emit(`option:${option.name()}`, value);
              } else {
                this.emit(`option:${option.name()}`);
              }
              activeVariadicOption = option.variadic ? option : null;
              continue;
            }
          }
          if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
            const option = this._findOption(`-${arg[1]}`);
            if (option) {
              if (option.required || option.optional && this._combineFlagAndOptionalValue) {
                this.emit(`option:${option.name()}`, arg.slice(2));
              } else {
                this.emit(`option:${option.name()}`);
                args.unshift(`-${arg.slice(2)}`);
              }
              continue;
            }
          }
          if (/^--[^=]+=/.test(arg)) {
            const index = arg.indexOf("=");
            const option = this._findOption(arg.slice(0, index));
            if (option && (option.required || option.optional)) {
              this.emit(`option:${option.name()}`, arg.slice(index + 1));
              continue;
            }
          }
          if (maybeOption(arg)) {
            dest = unknown;
          }
          if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
            if (this._findCommand(arg)) {
              operands.push(arg);
              if (args.length > 0) unknown.push(...args);
              break;
            } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
              operands.push(arg);
              if (args.length > 0) operands.push(...args);
              break;
            } else if (this._defaultCommandName) {
              unknown.push(arg);
              if (args.length > 0) unknown.push(...args);
              break;
            }
          }
          if (this._passThroughOptions) {
            dest.push(arg);
            if (args.length > 0) dest.push(...args);
            break;
          }
          dest.push(arg);
        }
        return { operands, unknown };
      }
      /**
       * Return an object containing local option values as key-value pairs.
       *
       * @return {object}
       */
      opts() {
        if (this._storeOptionsAsProperties) {
          const result = {};
          const len = this.options.length;
          for (let i2 = 0; i2 < len; i2++) {
            const key = this.options[i2].attributeName();
            result[key] = key === this._versionOptionName ? this._version : this[key];
          }
          return result;
        }
        return this._optionValues;
      }
      /**
       * Return an object containing merged local and global option values as key-value pairs.
       *
       * @return {object}
       */
      optsWithGlobals() {
        return this._getCommandAndAncestors().reduce(
          (combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()),
          {}
        );
      }
      /**
       * Display error message and exit (or call exitOverride).
       *
       * @param {string} message
       * @param {object} [errorOptions]
       * @param {string} [errorOptions.code] - an id string representing the error
       * @param {number} [errorOptions.exitCode] - used with process.exit
       */
      error(message, errorOptions) {
        this._outputConfiguration.outputError(
          `${message}
`,
          this._outputConfiguration.writeErr
        );
        if (typeof this._showHelpAfterError === "string") {
          this._outputConfiguration.writeErr(`${this._showHelpAfterError}
`);
        } else if (this._showHelpAfterError) {
          this._outputConfiguration.writeErr("\n");
          this.outputHelp({ error: true });
        }
        const config2 = errorOptions || {};
        const exitCode = config2.exitCode || 1;
        const code = config2.code || "commander.error";
        this._exit(exitCode, code, message);
      }
      /**
       * Apply any option related environment variables, if option does
       * not have a value from cli or client code.
       *
       * @private
       */
      _parseOptionsEnv() {
        this.options.forEach((option) => {
          if (option.envVar && option.envVar in process2.env) {
            const optionKey = option.attributeName();
            if (this.getOptionValue(optionKey) === void 0 || ["default", "config", "env"].includes(
              this.getOptionValueSource(optionKey)
            )) {
              if (option.required || option.optional) {
                this.emit(`optionEnv:${option.name()}`, process2.env[option.envVar]);
              } else {
                this.emit(`optionEnv:${option.name()}`);
              }
            }
          }
        });
      }
      /**
       * Apply any implied option values, if option is undefined or default value.
       *
       * @private
       */
      _parseOptionsImplied() {
        const dualHelper = new DualOptions(this.options);
        const hasCustomOptionValue = (optionKey) => {
          return this.getOptionValue(optionKey) !== void 0 && !["default", "implied"].includes(this.getOptionValueSource(optionKey));
        };
        this.options.filter(
          (option) => option.implied !== void 0 && hasCustomOptionValue(option.attributeName()) && dualHelper.valueFromOption(
            this.getOptionValue(option.attributeName()),
            option
          )
        ).forEach((option) => {
          Object.keys(option.implied).filter((impliedKey) => !hasCustomOptionValue(impliedKey)).forEach((impliedKey) => {
            this.setOptionValueWithSource(
              impliedKey,
              option.implied[impliedKey],
              "implied"
            );
          });
        });
      }
      /**
       * Argument `name` is missing.
       *
       * @param {string} name
       * @private
       */
      missingArgument(name2) {
        const message = `error: missing required argument '${name2}'`;
        this.error(message, { code: "commander.missingArgument" });
      }
      /**
       * `Option` is missing an argument.
       *
       * @param {Option} option
       * @private
       */
      optionMissingArgument(option) {
        const message = `error: option '${option.flags}' argument missing`;
        this.error(message, { code: "commander.optionMissingArgument" });
      }
      /**
       * `Option` does not have a value, and is a mandatory option.
       *
       * @param {Option} option
       * @private
       */
      missingMandatoryOptionValue(option) {
        const message = `error: required option '${option.flags}' not specified`;
        this.error(message, { code: "commander.missingMandatoryOptionValue" });
      }
      /**
       * `Option` conflicts with another option.
       *
       * @param {Option} option
       * @param {Option} conflictingOption
       * @private
       */
      _conflictingOption(option, conflictingOption) {
        const findBestOptionFromValue = (option2) => {
          const optionKey = option2.attributeName();
          const optionValue = this.getOptionValue(optionKey);
          const negativeOption = this.options.find(
            (target) => target.negate && optionKey === target.attributeName()
          );
          const positiveOption = this.options.find(
            (target) => !target.negate && optionKey === target.attributeName()
          );
          if (negativeOption && (negativeOption.presetArg === void 0 && optionValue === false || negativeOption.presetArg !== void 0 && optionValue === negativeOption.presetArg)) {
            return negativeOption;
          }
          return positiveOption || option2;
        };
        const getErrorMessage = (option2) => {
          const bestOption = findBestOptionFromValue(option2);
          const optionKey = bestOption.attributeName();
          const source = this.getOptionValueSource(optionKey);
          if (source === "env") {
            return `environment variable '${bestOption.envVar}'`;
          }
          return `option '${bestOption.flags}'`;
        };
        const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
        this.error(message, { code: "commander.conflictingOption" });
      }
      /**
       * Unknown option `flag`.
       *
       * @param {string} flag
       * @private
       */
      unknownOption(flag) {
        if (this._allowUnknownOption) return;
        let suggestion = "";
        if (flag.startsWith("--") && this._showSuggestionAfterError) {
          let candidateFlags = [];
          let command = this;
          do {
            const moreFlags = command.createHelp().visibleOptions(command).filter((option) => option.long).map((option) => option.long);
            candidateFlags = candidateFlags.concat(moreFlags);
            command = command.parent;
          } while (command && !command._enablePositionalOptions);
          suggestion = suggestSimilar(flag, candidateFlags);
        }
        const message = `error: unknown option '${flag}'${suggestion}`;
        this.error(message, { code: "commander.unknownOption" });
      }
      /**
       * Excess arguments, more than expected.
       *
       * @param {string[]} receivedArgs
       * @private
       */
      _excessArguments(receivedArgs) {
        if (this._allowExcessArguments) return;
        const expected = this.registeredArguments.length;
        const s = expected === 1 ? "" : "s";
        const forSubcommand = this.parent ? ` for '${this.name()}'` : "";
        const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
        this.error(message, { code: "commander.excessArguments" });
      }
      /**
       * Unknown command.
       *
       * @private
       */
      unknownCommand() {
        const unknownName = this.args[0];
        let suggestion = "";
        if (this._showSuggestionAfterError) {
          const candidateNames = [];
          this.createHelp().visibleCommands(this).forEach((command) => {
            candidateNames.push(command.name());
            if (command.alias()) candidateNames.push(command.alias());
          });
          suggestion = suggestSimilar(unknownName, candidateNames);
        }
        const message = `error: unknown command '${unknownName}'${suggestion}`;
        this.error(message, { code: "commander.unknownCommand" });
      }
      /**
       * Get or set the program version.
       *
       * This method auto-registers the "-V, --version" option which will print the version number.
       *
       * You can optionally supply the flags and description to override the defaults.
       *
       * @param {string} [str]
       * @param {string} [flags]
       * @param {string} [description]
       * @return {(this | string | undefined)} `this` command for chaining, or version string if no arguments
       */
      version(str, flags, description) {
        if (str === void 0) return this._version;
        this._version = str;
        flags = flags || "-V, --version";
        description = description || "output the version number";
        const versionOption = this.createOption(flags, description);
        this._versionOptionName = versionOption.attributeName();
        this._registerOption(versionOption);
        this.on("option:" + versionOption.name(), () => {
          this._outputConfiguration.writeOut(`${str}
`);
          this._exit(0, "commander.version", str);
        });
        return this;
      }
      /**
       * Set the description.
       *
       * @param {string} [str]
       * @param {object} [argsDescription]
       * @return {(string|Command)}
       */
      description(str, argsDescription) {
        if (str === void 0 && argsDescription === void 0)
          return this._description;
        this._description = str;
        if (argsDescription) {
          this._argsDescription = argsDescription;
        }
        return this;
      }
      /**
       * Set the summary. Used when listed as subcommand of parent.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      summary(str) {
        if (str === void 0) return this._summary;
        this._summary = str;
        return this;
      }
      /**
       * Set an alias for the command.
       *
       * You may call more than once to add multiple aliases. Only the first alias is shown in the auto-generated help.
       *
       * @param {string} [alias]
       * @return {(string|Command)}
       */
      alias(alias) {
        if (alias === void 0) return this._aliases[0];
        let command = this;
        if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
          command = this.commands[this.commands.length - 1];
        }
        if (alias === command._name)
          throw new Error("Command alias can't be the same as its name");
        const matchingCommand = this.parent?._findCommand(alias);
        if (matchingCommand) {
          const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join("|");
          throw new Error(
            `cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`
          );
        }
        command._aliases.push(alias);
        return this;
      }
      /**
       * Set aliases for the command.
       *
       * Only the first alias is shown in the auto-generated help.
       *
       * @param {string[]} [aliases]
       * @return {(string[]|Command)}
       */
      aliases(aliases) {
        if (aliases === void 0) return this._aliases;
        aliases.forEach((alias) => this.alias(alias));
        return this;
      }
      /**
       * Set / get the command usage `str`.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      usage(str) {
        if (str === void 0) {
          if (this._usage) return this._usage;
          const args = this.registeredArguments.map((arg) => {
            return humanReadableArgName(arg);
          });
          return [].concat(
            this.options.length || this._helpOption !== null ? "[options]" : [],
            this.commands.length ? "[command]" : [],
            this.registeredArguments.length ? args : []
          ).join(" ");
        }
        this._usage = str;
        return this;
      }
      /**
       * Get or set the name of the command.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      name(str) {
        if (str === void 0) return this._name;
        this._name = str;
        return this;
      }
      /**
       * Set the name of the command from script filename, such as process.argv[1],
       * or require.main.filename, or __filename.
       *
       * (Used internally and public although not documented in README.)
       *
       * @example
       * program.nameFromFilename(require.main.filename);
       *
       * @param {string} filename
       * @return {Command}
       */
      nameFromFilename(filename) {
        this._name = path.basename(filename, path.extname(filename));
        return this;
      }
      /**
       * Get or set the directory for searching for executable subcommands of this command.
       *
       * @example
       * program.executableDir(__dirname);
       * // or
       * program.executableDir('subcommands');
       *
       * @param {string} [path]
       * @return {(string|null|Command)}
       */
      executableDir(path2) {
        if (path2 === void 0) return this._executableDir;
        this._executableDir = path2;
        return this;
      }
      /**
       * Return program help documentation.
       *
       * @param {{ error: boolean }} [contextOptions] - pass {error:true} to wrap for stderr instead of stdout
       * @return {string}
       */
      helpInformation(contextOptions) {
        const helper = this.createHelp();
        const context = this._getOutputContext(contextOptions);
        helper.prepareContext({
          error: context.error,
          helpWidth: context.helpWidth,
          outputHasColors: context.hasColors
        });
        const text3 = helper.formatHelp(this, helper);
        if (context.hasColors) return text3;
        return this._outputConfiguration.stripColor(text3);
      }
      /**
       * @typedef HelpContext
       * @type {object}
       * @property {boolean} error
       * @property {number} helpWidth
       * @property {boolean} hasColors
       * @property {function} write - includes stripColor if needed
       *
       * @returns {HelpContext}
       * @private
       */
      _getOutputContext(contextOptions) {
        contextOptions = contextOptions || {};
        const error2 = !!contextOptions.error;
        let baseWrite;
        let hasColors;
        let helpWidth;
        if (error2) {
          baseWrite = (str) => this._outputConfiguration.writeErr(str);
          hasColors = this._outputConfiguration.getErrHasColors();
          helpWidth = this._outputConfiguration.getErrHelpWidth();
        } else {
          baseWrite = (str) => this._outputConfiguration.writeOut(str);
          hasColors = this._outputConfiguration.getOutHasColors();
          helpWidth = this._outputConfiguration.getOutHelpWidth();
        }
        const write2 = (str) => {
          if (!hasColors) str = this._outputConfiguration.stripColor(str);
          return baseWrite(str);
        };
        return { error: error2, write: write2, hasColors, helpWidth };
      }
      /**
       * Output help information for this command.
       *
       * Outputs built-in help, and custom text added using `.addHelpText()`.
       *
       * @param {{ error: boolean } | Function} [contextOptions] - pass {error:true} to write to stderr instead of stdout
       */
      outputHelp(contextOptions) {
        let deprecatedCallback;
        if (typeof contextOptions === "function") {
          deprecatedCallback = contextOptions;
          contextOptions = void 0;
        }
        const outputContext = this._getOutputContext(contextOptions);
        const eventContext = {
          error: outputContext.error,
          write: outputContext.write,
          command: this
        };
        this._getCommandAndAncestors().reverse().forEach((command) => command.emit("beforeAllHelp", eventContext));
        this.emit("beforeHelp", eventContext);
        let helpInformation = this.helpInformation({ error: outputContext.error });
        if (deprecatedCallback) {
          helpInformation = deprecatedCallback(helpInformation);
          if (typeof helpInformation !== "string" && !Buffer.isBuffer(helpInformation)) {
            throw new Error("outputHelp callback must return a string or a Buffer");
          }
        }
        outputContext.write(helpInformation);
        if (this._getHelpOption()?.long) {
          this.emit(this._getHelpOption().long);
        }
        this.emit("afterHelp", eventContext);
        this._getCommandAndAncestors().forEach(
          (command) => command.emit("afterAllHelp", eventContext)
        );
      }
      /**
       * You can pass in flags and a description to customise the built-in help option.
       * Pass in false to disable the built-in help option.
       *
       * @example
       * program.helpOption('-?, --help' 'show help'); // customise
       * program.helpOption(false); // disable
       *
       * @param {(string | boolean)} flags
       * @param {string} [description]
       * @return {Command} `this` command for chaining
       */
      helpOption(flags, description) {
        if (typeof flags === "boolean") {
          if (flags) {
            this._helpOption = this._helpOption ?? void 0;
          } else {
            this._helpOption = null;
          }
          return this;
        }
        flags = flags ?? "-h, --help";
        description = description ?? "display help for command";
        this._helpOption = this.createOption(flags, description);
        return this;
      }
      /**
       * Lazy create help option.
       * Returns null if has been disabled with .helpOption(false).
       *
       * @returns {(Option | null)} the help option
       * @package
       */
      _getHelpOption() {
        if (this._helpOption === void 0) {
          this.helpOption(void 0, void 0);
        }
        return this._helpOption;
      }
      /**
       * Supply your own option to use for the built-in help option.
       * This is an alternative to using helpOption() to customise the flags and description etc.
       *
       * @param {Option} option
       * @return {Command} `this` command for chaining
       */
      addHelpOption(option) {
        this._helpOption = option;
        return this;
      }
      /**
       * Output help information and exit.
       *
       * Outputs built-in help, and custom text added using `.addHelpText()`.
       *
       * @param {{ error: boolean }} [contextOptions] - pass {error:true} to write to stderr instead of stdout
       */
      help(contextOptions) {
        this.outputHelp(contextOptions);
        let exitCode = Number(process2.exitCode ?? 0);
        if (exitCode === 0 && contextOptions && typeof contextOptions !== "function" && contextOptions.error) {
          exitCode = 1;
        }
        this._exit(exitCode, "commander.help", "(outputHelp)");
      }
      /**
       * // Do a little typing to coordinate emit and listener for the help text events.
       * @typedef HelpTextEventContext
       * @type {object}
       * @property {boolean} error
       * @property {Command} command
       * @property {function} write
       */
      /**
       * Add additional text to be displayed with the built-in help.
       *
       * Position is 'before' or 'after' to affect just this command,
       * and 'beforeAll' or 'afterAll' to affect this command and all its subcommands.
       *
       * @param {string} position - before or after built-in help
       * @param {(string | Function)} text - string to add, or a function returning a string
       * @return {Command} `this` command for chaining
       */
      addHelpText(position, text3) {
        const allowedValues = ["beforeAll", "before", "after", "afterAll"];
        if (!allowedValues.includes(position)) {
          throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
        }
        const helpEvent = `${position}Help`;
        this.on(helpEvent, (context) => {
          let helpStr;
          if (typeof text3 === "function") {
            helpStr = text3({ error: context.error, command: context.command });
          } else {
            helpStr = text3;
          }
          if (helpStr) {
            context.write(`${helpStr}
`);
          }
        });
        return this;
      }
      /**
       * Output help information if help flags specified
       *
       * @param {Array} args - array of options to search for help flags
       * @private
       */
      _outputHelpIfRequested(args) {
        const helpOption = this._getHelpOption();
        const helpRequested = helpOption && args.find((arg) => helpOption.is(arg));
        if (helpRequested) {
          this.outputHelp();
          this._exit(0, "commander.helpDisplayed", "(outputHelp)");
        }
      }
    };
    function incrementNodeInspectorPort(args) {
      return args.map((arg) => {
        if (!arg.startsWith("--inspect")) {
          return arg;
        }
        let debugOption;
        let debugHost = "127.0.0.1";
        let debugPort = "9229";
        let match;
        if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
          debugOption = match[1];
        } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
          debugOption = match[1];
          if (/^\d+$/.test(match[3])) {
            debugPort = match[3];
          } else {
            debugHost = match[3];
          }
        } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
          debugOption = match[1];
          debugHost = match[3];
          debugPort = match[4];
        }
        if (debugOption && debugPort !== "0") {
          return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
        }
        return arg;
      });
    }
    function useColor() {
      if (process2.env.NO_COLOR || process2.env.FORCE_COLOR === "0" || process2.env.FORCE_COLOR === "false")
        return false;
      if (process2.env.FORCE_COLOR || process2.env.CLICOLOR_FORCE !== void 0)
        return true;
      return void 0;
    }
    exports.Command = Command2;
    exports.useColor = useColor;
  }
});

// node_modules/commander/index.js
var require_commander = __commonJS({
  "node_modules/commander/index.js"(exports) {
    var { Argument: Argument2 } = require_argument();
    var { Command: Command2 } = require_command();
    var { CommanderError: CommanderError2, InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var { Help: Help2 } = require_help();
    var { Option: Option2 } = require_option();
    exports.program = new Command2();
    exports.createCommand = (name2) => new Command2(name2);
    exports.createOption = (flags, description) => new Option2(flags, description);
    exports.createArgument = (name2, description) => new Argument2(name2, description);
    exports.Command = Command2;
    exports.Option = Option2;
    exports.Argument = Argument2;
    exports.Help = Help2;
    exports.CommanderError = CommanderError2;
    exports.InvalidArgumentError = InvalidArgumentError2;
    exports.InvalidOptionArgumentError = InvalidArgumentError2;
  }
});

// node_modules/fast-string-truncated-width/dist/utils.js
var getCodePointsLength, isFullWidth, isWideNotCJKTNotEmoji;
var init_utils = __esm({
  "node_modules/fast-string-truncated-width/dist/utils.js"() {
    getCodePointsLength = /* @__PURE__ */ (() => {
      const SURROGATE_PAIR_RE = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
      return (input) => {
        let surrogatePairsNr = 0;
        SURROGATE_PAIR_RE.lastIndex = 0;
        while (SURROGATE_PAIR_RE.test(input)) {
          surrogatePairsNr += 1;
        }
        return input.length - surrogatePairsNr;
      };
    })();
    isFullWidth = (x) => {
      return x === 12288 || x >= 65281 && x <= 65376 || x >= 65504 && x <= 65510;
    };
    isWideNotCJKTNotEmoji = (x) => {
      return x === 8987 || x === 9001 || x >= 12272 && x <= 12287 || x >= 12289 && x <= 12350 || x >= 12441 && x <= 12543 || x >= 12549 && x <= 12591 || x >= 12593 && x <= 12686 || x >= 12688 && x <= 12771 || x >= 12783 && x <= 12830 || x >= 12832 && x <= 12871 || x >= 12880 && x <= 19903 || x >= 65040 && x <= 65049 || x >= 65072 && x <= 65106 || x >= 65108 && x <= 65126 || x >= 65128 && x <= 65131 || x >= 127488 && x <= 127490 || x >= 127504 && x <= 127547 || x >= 127552 && x <= 127560 || x >= 131072 && x <= 196605 || x >= 196608 && x <= 262141;
    };
  }
});

// node_modules/fast-string-truncated-width/dist/index.js
var ANSI_RE, CONTROL_RE, CJKT_WIDE_RE, TAB_RE, EMOJI_RE, LATIN_RE, MODIFIER_RE, NO_TRUNCATION, getStringTruncatedWidth, dist_default;
var init_dist = __esm({
  "node_modules/fast-string-truncated-width/dist/index.js"() {
    init_utils();
    ANSI_RE = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]|\u001b\]8;[^;]*;.*?(?:\u0007|\u001b\u005c)/y;
    CONTROL_RE = /[\x00-\x08\x0A-\x1F\x7F-\x9F]{1,1000}/y;
    CJKT_WIDE_RE = /(?:(?![\uFF61-\uFF9F\uFF00-\uFFEF])[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Tangut}]){1,1000}/yu;
    TAB_RE = /\t{1,1000}/y;
    EMOJI_RE = new RegExp("[\\u{1F1E6}-\\u{1F1FF}]{2}|\\u{1F3F4}[\\u{E0061}-\\u{E007A}]{2}[\\u{E0030}-\\u{E0039}\\u{E0061}-\\u{E007A}]{1,3}\\u{E007F}|(?:\\p{Emoji}\\uFE0F\\u20E3?|\\p{Emoji_Modifier_Base}\\p{Emoji_Modifier}?|\\p{Emoji_Presentation})(?:\\u200D(?:\\p{Emoji_Modifier_Base}\\p{Emoji_Modifier}?|\\p{Emoji_Presentation}|\\p{Emoji}\\uFE0F\\u20E3?))*", "yu");
    LATIN_RE = /(?:[\x20-\x7E\xA0-\xFF](?!\uFE0F)){1,1000}/y;
    MODIFIER_RE = new RegExp("\\p{M}+", "gu");
    NO_TRUNCATION = { limit: Infinity, ellipsis: "" };
    getStringTruncatedWidth = (input, truncationOptions = {}, widthOptions = {}) => {
      const LIMIT = truncationOptions.limit ?? Infinity;
      const ELLIPSIS = truncationOptions.ellipsis ?? "";
      const ELLIPSIS_WIDTH = truncationOptions?.ellipsisWidth ?? (ELLIPSIS ? getStringTruncatedWidth(ELLIPSIS, NO_TRUNCATION, widthOptions).width : 0);
      const ANSI_WIDTH = 0;
      const CONTROL_WIDTH = widthOptions.controlWidth ?? 0;
      const TAB_WIDTH = widthOptions.tabWidth ?? 8;
      const EMOJI_WIDTH = widthOptions.emojiWidth ?? 2;
      const FULL_WIDTH_WIDTH = 2;
      const REGULAR_WIDTH = widthOptions.regularWidth ?? 1;
      const WIDE_WIDTH = widthOptions.wideWidth ?? FULL_WIDTH_WIDTH;
      const PARSE_BLOCKS = [
        [LATIN_RE, REGULAR_WIDTH],
        [ANSI_RE, ANSI_WIDTH],
        [CONTROL_RE, CONTROL_WIDTH],
        [TAB_RE, TAB_WIDTH],
        [EMOJI_RE, EMOJI_WIDTH],
        [CJKT_WIDE_RE, WIDE_WIDTH]
      ];
      let indexPrev = 0;
      let index = 0;
      let length = input.length;
      let lengthExtra = 0;
      let truncationEnabled = false;
      let truncationIndex = length;
      let truncationLimit = Math.max(0, LIMIT - ELLIPSIS_WIDTH);
      let unmatchedStart = 0;
      let unmatchedEnd = 0;
      let width2 = 0;
      let widthExtra = 0;
      outer: while (true) {
        if (unmatchedEnd > unmatchedStart || index >= length && index > indexPrev) {
          const unmatched = input.slice(unmatchedStart, unmatchedEnd) || input.slice(indexPrev, index);
          lengthExtra = 0;
          for (const char of unmatched.replaceAll(MODIFIER_RE, "")) {
            const codePoint = char.codePointAt(0) || 0;
            if (isFullWidth(codePoint)) {
              widthExtra = FULL_WIDTH_WIDTH;
            } else if (isWideNotCJKTNotEmoji(codePoint)) {
              widthExtra = WIDE_WIDTH;
            } else {
              widthExtra = REGULAR_WIDTH;
            }
            if (width2 + widthExtra > truncationLimit) {
              truncationIndex = Math.min(truncationIndex, Math.max(unmatchedStart, indexPrev) + lengthExtra);
            }
            if (width2 + widthExtra > LIMIT) {
              truncationEnabled = true;
              break outer;
            }
            lengthExtra += char.length;
            width2 += widthExtra;
          }
          unmatchedStart = unmatchedEnd = 0;
        }
        if (index >= length) {
          break outer;
        }
        for (let i2 = 0, l2 = PARSE_BLOCKS.length; i2 < l2; i2++) {
          const [BLOCK_RE, BLOCK_WIDTH] = PARSE_BLOCKS[i2];
          BLOCK_RE.lastIndex = index;
          if (BLOCK_RE.test(input)) {
            lengthExtra = BLOCK_RE === CJKT_WIDE_RE ? getCodePointsLength(input.slice(index, BLOCK_RE.lastIndex)) : BLOCK_RE === EMOJI_RE ? 1 : BLOCK_RE.lastIndex - index;
            widthExtra = lengthExtra * BLOCK_WIDTH;
            if (width2 + widthExtra > truncationLimit) {
              truncationIndex = Math.min(truncationIndex, index + Math.floor((truncationLimit - width2) / BLOCK_WIDTH));
            }
            if (width2 + widthExtra > LIMIT) {
              truncationEnabled = true;
              break outer;
            }
            width2 += widthExtra;
            unmatchedStart = indexPrev;
            unmatchedEnd = index;
            index = indexPrev = BLOCK_RE.lastIndex;
            continue outer;
          }
        }
        index += 1;
      }
      return {
        width: truncationEnabled ? truncationLimit : width2,
        index: truncationEnabled ? truncationIndex : length,
        truncated: truncationEnabled,
        ellipsed: truncationEnabled && LIMIT >= ELLIPSIS_WIDTH
      };
    };
    dist_default = getStringTruncatedWidth;
  }
});

// node_modules/fast-string-width/dist/index.js
var NO_TRUNCATION2, fastStringWidth, dist_default2;
var init_dist2 = __esm({
  "node_modules/fast-string-width/dist/index.js"() {
    init_dist();
    NO_TRUNCATION2 = {
      limit: Infinity,
      ellipsis: "",
      ellipsisWidth: 0
    };
    fastStringWidth = (input, options = {}) => {
      return dist_default(input, NO_TRUNCATION2, options).width;
    };
    dist_default2 = fastStringWidth;
  }
});

// node_modules/fast-wrap-ansi/lib/main.js
function wrapAnsi(string, columns, options) {
  return String(string).normalize().split(CRLF_OR_LF).map((line) => exec(line, columns, options)).join("\n");
}
var ESC, CSI, END_CODE, ANSI_ESCAPE_BELL, ANSI_CSI, ANSI_OSC, ANSI_SGR_TERMINATOR, ANSI_ESCAPE_LINK, GROUP_REGEX, getClosingCode, wrapAnsiCode, wrapAnsiHyperlink, wrapWord, stringVisibleTrimSpacesRight, exec, CRLF_OR_LF;
var init_main = __esm({
  "node_modules/fast-wrap-ansi/lib/main.js"() {
    init_dist2();
    ESC = "\x1B";
    CSI = "\x9B";
    END_CODE = 39;
    ANSI_ESCAPE_BELL = "\x07";
    ANSI_CSI = "[";
    ANSI_OSC = "]";
    ANSI_SGR_TERMINATOR = "m";
    ANSI_ESCAPE_LINK = `${ANSI_OSC}8;;`;
    GROUP_REGEX = new RegExp(`(?:\\${ANSI_CSI}(?<code>\\d+)m|\\${ANSI_ESCAPE_LINK}(?<uri>.*)${ANSI_ESCAPE_BELL})`, "y");
    getClosingCode = (openingCode) => {
      if (openingCode >= 30 && openingCode <= 37)
        return 39;
      if (openingCode >= 90 && openingCode <= 97)
        return 39;
      if (openingCode >= 40 && openingCode <= 47)
        return 49;
      if (openingCode >= 100 && openingCode <= 107)
        return 49;
      if (openingCode === 1 || openingCode === 2)
        return 22;
      if (openingCode === 3)
        return 23;
      if (openingCode === 4)
        return 24;
      if (openingCode === 7)
        return 27;
      if (openingCode === 8)
        return 28;
      if (openingCode === 9)
        return 29;
      if (openingCode === 0)
        return 0;
      return void 0;
    };
    wrapAnsiCode = (code) => `${ESC}${ANSI_CSI}${code}${ANSI_SGR_TERMINATOR}`;
    wrapAnsiHyperlink = (url) => `${ESC}${ANSI_ESCAPE_LINK}${url}${ANSI_ESCAPE_BELL}`;
    wrapWord = (rows, word, columns) => {
      const characters = word[Symbol.iterator]();
      let isInsideEscape = false;
      let isInsideLinkEscape = false;
      let lastRow = rows.at(-1);
      let visible = lastRow === void 0 ? 0 : dist_default2(lastRow);
      let currentCharacter = characters.next();
      let nextCharacter = characters.next();
      let rawCharacterIndex = 0;
      while (!currentCharacter.done) {
        const character = currentCharacter.value;
        const characterLength = dist_default2(character);
        if (visible + characterLength <= columns) {
          rows[rows.length - 1] += character;
        } else {
          rows.push(character);
          visible = 0;
        }
        if (character === ESC || character === CSI) {
          isInsideEscape = true;
          isInsideLinkEscape = word.startsWith(ANSI_ESCAPE_LINK, rawCharacterIndex + 1);
        }
        if (isInsideEscape) {
          if (isInsideLinkEscape) {
            if (character === ANSI_ESCAPE_BELL) {
              isInsideEscape = false;
              isInsideLinkEscape = false;
            }
          } else if (character === ANSI_SGR_TERMINATOR) {
            isInsideEscape = false;
          }
        } else {
          visible += characterLength;
          if (visible === columns && !nextCharacter.done) {
            rows.push("");
            visible = 0;
          }
        }
        currentCharacter = nextCharacter;
        nextCharacter = characters.next();
        rawCharacterIndex += character.length;
      }
      lastRow = rows.at(-1);
      if (!visible && lastRow !== void 0 && lastRow.length && rows.length > 1) {
        rows[rows.length - 2] += rows.pop();
      }
    };
    stringVisibleTrimSpacesRight = (string) => {
      const words = string.split(" ");
      let last = words.length;
      while (last) {
        if (dist_default2(words[last - 1])) {
          break;
        }
        last--;
      }
      if (last === words.length) {
        return string;
      }
      return words.slice(0, last).join(" ") + words.slice(last).join("");
    };
    exec = (string, columns, options = {}) => {
      if (options.trim !== false && string.trim() === "") {
        return "";
      }
      let returnValue = "";
      let escapeCode;
      let escapeUrl;
      const words = string.split(" ");
      let rows = [""];
      let rowLength = 0;
      for (let index = 0; index < words.length; index++) {
        const word = words[index];
        if (options.trim !== false) {
          const row = rows.at(-1) ?? "";
          const trimmed = row.trimStart();
          if (row.length !== trimmed.length) {
            rows[rows.length - 1] = trimmed;
            rowLength = dist_default2(trimmed);
          }
        }
        if (index !== 0) {
          if (rowLength >= columns && (options.wordWrap === false || options.trim === false)) {
            rows.push("");
            rowLength = 0;
          }
          if (rowLength || options.trim === false) {
            rows[rows.length - 1] += " ";
            rowLength++;
          }
        }
        const wordLength = dist_default2(word);
        if (options.hard && wordLength > columns) {
          const remainingColumns = columns - rowLength;
          const breaksStartingThisLine = 1 + Math.floor((wordLength - remainingColumns - 1) / columns);
          const breaksStartingNextLine = Math.floor((wordLength - 1) / columns);
          if (breaksStartingNextLine < breaksStartingThisLine) {
            rows.push("");
          }
          wrapWord(rows, word, columns);
          rowLength = dist_default2(rows.at(-1) ?? "");
          continue;
        }
        if (rowLength + wordLength > columns && rowLength && wordLength) {
          if (options.wordWrap === false && rowLength < columns) {
            wrapWord(rows, word, columns);
            rowLength = dist_default2(rows.at(-1) ?? "");
            continue;
          }
          rows.push("");
          rowLength = 0;
        }
        if (rowLength + wordLength > columns && options.wordWrap === false) {
          wrapWord(rows, word, columns);
          rowLength = dist_default2(rows.at(-1) ?? "");
          continue;
        }
        rows[rows.length - 1] += word;
        rowLength += wordLength;
      }
      if (options.trim !== false) {
        rows = rows.map((row) => stringVisibleTrimSpacesRight(row));
      }
      const preString = rows.join("\n");
      let inSurrogate = false;
      for (let i2 = 0; i2 < preString.length; i2++) {
        const character = preString[i2];
        returnValue += character;
        if (!inSurrogate) {
          inSurrogate = character >= "\uD800" && character <= "\uDBFF";
          if (inSurrogate) {
            continue;
          }
        } else {
          inSurrogate = false;
        }
        if (character === ESC || character === CSI) {
          GROUP_REGEX.lastIndex = i2 + 1;
          const groupsResult = GROUP_REGEX.exec(preString);
          const groups = groupsResult?.groups;
          if (groups?.code !== void 0) {
            const code = Number.parseFloat(groups.code);
            escapeCode = code === END_CODE ? void 0 : code;
          } else if (groups?.uri !== void 0) {
            escapeUrl = groups.uri.length === 0 ? void 0 : groups.uri;
          }
        }
        if (preString[i2 + 1] === "\n") {
          if (escapeUrl) {
            returnValue += wrapAnsiHyperlink("");
          }
          const closingCode = escapeCode ? getClosingCode(escapeCode) : void 0;
          if (escapeCode && closingCode) {
            returnValue += wrapAnsiCode(closingCode);
          }
        } else if (character === "\n") {
          if (escapeCode && getClosingCode(escapeCode)) {
            returnValue += wrapAnsiCode(escapeCode);
          }
          if (escapeUrl) {
            returnValue += wrapAnsiHyperlink(escapeUrl);
          }
        }
      }
      return returnValue;
    };
    CRLF_OR_LF = /\r?\n/;
  }
});

// node_modules/sisteransi/src/index.js
var require_src = __commonJS({
  "node_modules/sisteransi/src/index.js"(exports, module) {
    "use strict";
    var ESC2 = "\x1B";
    var CSI2 = `${ESC2}[`;
    var beep = "\x07";
    var cursor3 = {
      to(x, y2) {
        if (!y2) return `${CSI2}${x + 1}G`;
        return `${CSI2}${y2 + 1};${x + 1}H`;
      },
      move(x, y2) {
        let ret = "";
        if (x < 0) ret += `${CSI2}${-x}D`;
        else if (x > 0) ret += `${CSI2}${x}C`;
        if (y2 < 0) ret += `${CSI2}${-y2}A`;
        else if (y2 > 0) ret += `${CSI2}${y2}B`;
        return ret;
      },
      up: (count = 1) => `${CSI2}${count}A`,
      down: (count = 1) => `${CSI2}${count}B`,
      forward: (count = 1) => `${CSI2}${count}C`,
      backward: (count = 1) => `${CSI2}${count}D`,
      nextLine: (count = 1) => `${CSI2}E`.repeat(count),
      prevLine: (count = 1) => `${CSI2}F`.repeat(count),
      left: `${CSI2}G`,
      hide: `${CSI2}?25l`,
      show: `${CSI2}?25h`,
      save: `${ESC2}7`,
      restore: `${ESC2}8`
    };
    var scroll = {
      up: (count = 1) => `${CSI2}S`.repeat(count),
      down: (count = 1) => `${CSI2}T`.repeat(count)
    };
    var erase3 = {
      screen: `${CSI2}2J`,
      up: (count = 1) => `${CSI2}1J`.repeat(count),
      down: (count = 1) => `${CSI2}J`.repeat(count),
      line: `${CSI2}2K`,
      lineEnd: `${CSI2}K`,
      lineStart: `${CSI2}1K`,
      lines(count) {
        let clear = "";
        for (let i2 = 0; i2 < count; i2++)
          clear += this.line + (i2 < count - 1 ? cursor3.up() : "");
        if (count)
          clear += cursor3.left;
        return clear;
      }
    };
    module.exports = { cursor: cursor3, scroll, erase: erase3, beep };
  }
});

// node_modules/@clack/core/dist/index.mjs
import { styleText } from "node:util";
import { stdout, stdin } from "node:process";
import * as l from "node:readline";
import l__default from "node:readline";
import { ReadStream } from "node:tty";
function findCursor(s, o, l2) {
  if (!l2.some((r2) => !r2.disabled))
    return s;
  const t2 = s + o, n3 = Math.max(l2.length - 1, 0), e = t2 < 0 ? n3 : t2 > n3 ? 0 : t2;
  return l2[e]?.disabled ? findCursor(e, o < 0 ? -1 : 1, l2) : e;
}
function isAccessible(n3) {
  if (n3 !== void 0) return n3;
  if (settings.accessible !== void 0) return settings.accessible;
  const e = process.env.ACCESSIBLE;
  return e !== void 0 && e !== "" && e !== "0" && e !== "false";
}
function isActionKey(n3, e) {
  if (typeof n3 == "string")
    return settings.aliases.get(n3) === e;
  for (const s of n3)
    if (s !== void 0 && isActionKey(s, e))
      return true;
  return false;
}
function diffLines(i2, s) {
  if (i2 === s) return;
  const e = i2.split(`
`), t2 = s.split(`
`), r2 = Math.max(e.length, t2.length), f = [];
  for (let n3 = 0; n3 < r2; n3++)
    e[n3] !== t2[n3] && f.push(n3);
  return {
    lines: f,
    numLinesBefore: e.length,
    numLinesAfter: t2.length,
    numLines: r2
  };
}
function isCancel(e) {
  return e === CANCEL_SYMBOL;
}
function setRawMode(e, r2) {
  const o = e;
  o.isTTY && o.setRawMode(r2);
}
function block({
  input: e = stdin,
  output: r2 = stdout,
  overwrite: o = true,
  hideCursor: n3 = true
} = {}) {
  const s = l.createInterface({
    input: e,
    output: r2,
    prompt: "",
    tabSize: 1
  });
  l.emitKeypressEvents(e, s), e instanceof ReadStream && e.isTTY && e.setRawMode(true);
  const t2 = (f, { name: a2, sequence: w }) => {
    const c2 = String(f);
    if (isActionKey([c2, a2, w], "cancel")) {
      n3 && r2.write(import_sisteransi.cursor.show), process.exit(0);
      return;
    }
    if (!o) return;
    const i2 = a2 === "return" ? 0 : -1, m = a2 === "return" ? -1 : 0;
    l.moveCursor(r2, i2, m, () => {
      l.clearLine(r2, 1, () => {
        e.once("keypress", t2);
      });
    });
  };
  return n3 && r2.write(import_sisteransi.cursor.hide), e.once("keypress", t2), () => {
    e.off("keypress", t2), n3 && r2.write(import_sisteransi.cursor.show), e instanceof ReadStream && e.isTTY && !R && e.setRawMode(false), s.terminal = false, s.close();
  };
}
function wrapTextWithPrefix(e, r2, o, n3 = o, s = o, t2) {
  const f = getColumns(e ?? stdout);
  return wrapAnsi(r2, f - o.length, {
    hard: true,
    trim: false
  }).split(`
`).map((c2, i2, m) => {
    const d = t2 ? t2(c2, i2) : c2;
    return i2 === 0 ? `${n3}${d}` : i2 === m.length - 1 ? `${s}${d}` : `${o}${d}`;
  }).join(`
`);
}
function runValidation(e, a2) {
  if ("~standard" in e) {
    const n3 = e["~standard"].validate(a2);
    return n3 instanceof Promise ? n3.then((r2) => r2.issues?.at(0)?.message) : n3.issues?.at(0)?.message;
  }
  return e(a2);
}
var import_sisteransi, a$1, t, settings, R, CANCEL_SYMBOL, getColumns, getRows, y, r, u$2, u$1, n$1, n2;
var init_dist3 = __esm({
  "node_modules/@clack/core/dist/index.mjs"() {
    init_main();
    import_sisteransi = __toESM(require_src(), 1);
    a$1 = ["up", "down", "left", "right", "space", "enter", "cancel"];
    t = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];
    settings = {
      actions: new Set(a$1),
      aliases: /* @__PURE__ */ new Map([
        // vim support
        ["k", "up"],
        ["j", "down"],
        ["h", "left"],
        ["l", "right"],
        ["", "cancel"],
        // opinionated defaults!
        ["escape", "cancel"]
      ]),
      messages: {
        cancel: "Canceled",
        error: "Something went wrong"
      },
      withGuide: true,
      accessible: void 0,
      date: {
        monthNames: [...t],
        messages: {
          required: "Please enter a valid date",
          invalidMonth: "There are only 12 months in a year",
          invalidDay: (n3, e) => `There are only ${n3} days in ${e}`,
          afterMin: (n3) => `Date must be on or after ${n3.toISOString().slice(0, 10)}`,
          beforeMax: (n3) => `Date must be on or before ${n3.toISOString().slice(0, 10)}`
        }
      }
    };
    R = globalThis.process.platform.startsWith("win");
    CANCEL_SYMBOL = Symbol("clack:cancel");
    getColumns = (e) => "columns" in e && typeof e.columns == "number" ? e.columns : 80;
    getRows = (e) => "rows" in e && typeof e.rows == "number" ? e.rows : 20;
    y = class {
      input;
      output;
      _abortSignal;
      rl;
      opts;
      _render;
      _track = false;
      _prevFrame = "";
      _subscribers = /* @__PURE__ */ new Map();
      _cursor = 0;
      state = "initial";
      error = "";
      value;
      userInput = "";
      /**
       * Whether accessible (static, screen-reader friendly) output is enabled for
       * this prompt, resolved from the `accessible` option, the global setting,
       * and the `ACCESSIBLE` env var.
       */
      get accessible() {
        return isAccessible(this.opts.accessible);
      }
      constructor(t2, e = true) {
        const { input: i2 = stdin, output: s = stdout, render: r2, signal: n3, ...o } = t2;
        this.opts = o, this.onKeypress = this.onKeypress.bind(this), this.close = this.close.bind(this), this.render = this.render.bind(this), this._render = r2.bind(this), this._track = e, this._abortSignal = n3, this.input = i2, this.output = s;
      }
      /**
       * Unsubscribe all listeners
       */
      unsubscribe() {
        this._subscribers.clear();
      }
      /**
       * Set a subscriber with opts
       * @param event - The event name
       */
      setSubscriber(t2, e) {
        const i2 = this._subscribers.get(t2) ?? [];
        i2.push(e), this._subscribers.set(t2, i2);
      }
      /**
       * Subscribe to an event
       * @param event - The event name
       * @param cb - The callback
       */
      on(t2, e) {
        this.setSubscriber(t2, { cb: e });
      }
      /**
       * Subscribe to an event once
       * @param event - The event name
       * @param cb - The callback
       */
      once(t2, e) {
        this.setSubscriber(t2, { cb: e, once: true });
      }
      /**
       * Emit an event with data
       * @param event - The event name
       * @param data - The data to pass to the callback
       */
      emit(t2, ...e) {
        const i2 = this._subscribers.get(t2) ?? [], s = [];
        for (const r2 of i2)
          r2.cb(...e), r2.once && s.push(() => i2.splice(i2.indexOf(r2), 1));
        for (const r2 of s)
          r2();
      }
      prompt() {
        return new Promise((t2) => {
          if (this._abortSignal) {
            if (this._abortSignal.aborted)
              return this.state = "cancel", this.close(), t2(CANCEL_SYMBOL);
            this._abortSignal.addEventListener(
              "abort",
              () => {
                this.state = "cancel", this.close();
              },
              { once: true }
            );
          }
          this.rl = l__default.createInterface({
            input: this.input,
            tabSize: 2,
            prompt: "",
            escapeCodeTimeout: 50,
            terminal: true
          }), this.rl.prompt(), this.opts.initialUserInput !== void 0 && this._setUserInput(this.opts.initialUserInput, true), this.input.on("keypress", this.onKeypress), setRawMode(this.input, true), this.output.on("resize", this.render), this.render(), this.once("submit", () => {
            this.output.write(import_sisteransi.cursor.show), this.output.off("resize", this.render), setRawMode(this.input, false), t2(this.value);
          }), this.once("cancel", () => {
            this.output.write(import_sisteransi.cursor.show), this.output.off("resize", this.render), setRawMode(this.input, false), t2(CANCEL_SYMBOL);
          });
        });
      }
      _isActionKey(t2, e) {
        return t2 === "	";
      }
      _shouldSubmit(t2, e) {
        return true;
      }
      _setValue(t2) {
        this.value = t2, this.emit("value", this.value);
      }
      _setUserInput(t2, e) {
        this.userInput = t2 ?? "", this.emit("userInput", this.userInput), e && this._track && this.rl && (this.rl.write(this.userInput), this._cursor = this.rl.cursor);
      }
      _clearUserInput() {
        this.rl?.write(null, { ctrl: true, name: "u" }), this._setUserInput("");
      }
      async onKeypress(t2, e) {
        if (this.state !== "validating") {
          if (this._track && e.name !== "return" && (e.name && this._isActionKey(t2, e) && this.rl?.write(null, { ctrl: true, name: "h" }), this._cursor = this.rl?.cursor ?? 0, this._setUserInput(this.rl?.line)), this.state === "error" && (this.state = "active"), e?.name && (!this._track && settings.aliases.has(e.name) && this.emit("cursor", settings.aliases.get(e.name)), settings.actions.has(e.name) && this.emit("cursor", e.name)), t2 && (t2.toLowerCase() === "y" || t2.toLowerCase() === "n") && this.emit("confirm", t2.toLowerCase() === "y"), this.emit("key", t2, e), e?.name === "return" && this._shouldSubmit(t2, e)) {
            if (this.opts.validate) {
              const i2 = runValidation(this.opts.validate, this.value);
              let s;
              i2 instanceof Promise ? (this.state = "validating", this.render(), s = await i2) : s = i2, s && (this.error = s instanceof Error ? s.message : s, this.state = "error", this.rl?.write(this.userInput));
            }
            this.state !== "error" && (this.state = "submit");
          }
          isActionKey([t2, e?.name, e?.sequence], "cancel") && (this.state = "cancel"), (this.state === "submit" || this.state === "cancel") && this.emit("finalize"), this.render(), (this.state === "submit" || this.state === "cancel") && this.close();
        }
      }
      close() {
        this.input.unpipe(), this.input.removeListener("keypress", this.onKeypress), this.output.write(`
`), setRawMode(this.input, false), this.rl?.close(), this.rl = void 0, this.emit(`${this.state}`, this.value), this.unsubscribe();
      }
      restoreCursor() {
        const t2 = wrapAnsi(this._prevFrame, process.stdout.columns, { hard: true, trim: false }).split(`
`).length - 1;
        this.output.write(import_sisteransi.cursor.move(-999, t2 * -1));
      }
      render() {
        const t2 = wrapAnsi(this._render(this) ?? "", process.stdout.columns, {
          hard: true,
          trim: false
        });
        if (t2 !== this._prevFrame) {
          if (this.state === "initial")
            this.output.write(import_sisteransi.cursor.hide);
          else {
            const e = diffLines(this._prevFrame, t2), i2 = getRows(this.output);
            if (this.restoreCursor(), e) {
              const s = Math.max(0, e.numLinesAfter - i2), r2 = Math.max(0, e.numLinesBefore - i2);
              let n3 = e.lines.find((o) => o >= s);
              if (n3 === void 0) {
                this._prevFrame = t2;
                return;
              }
              if (e.lines.length === 1) {
                this.output.write(import_sisteransi.cursor.move(0, n3 - r2)), this.output.write(import_sisteransi.erase.lines(1));
                const o = t2.split(`
`);
                this.output.write(o[n3]), this._prevFrame = t2, this.output.write(import_sisteransi.cursor.move(0, o.length - n3 - 1));
                return;
              } else if (e.lines.length > 1) {
                if (s < r2)
                  n3 = s;
                else {
                  const h2 = n3 - r2;
                  h2 > 0 && this.output.write(import_sisteransi.cursor.move(0, h2));
                }
                this.output.write(import_sisteransi.erase.down());
                const f = t2.split(`
`).slice(n3);
                this.output.write(f.join(`
`)), this._prevFrame = t2;
                return;
              }
            }
            this.output.write(import_sisteransi.erase.down());
          }
          this.output.write(t2), this.state === "initial" && (this.state = "active"), this._prevFrame = t2;
        }
      }
    };
    r = class extends y {
      get cursor() {
        return this.value ? 0 : 1;
      }
      get _value() {
        return this.cursor === 0;
      }
      constructor(t2) {
        super(t2, false), this.value = !!t2.initialValue, this.on("userInput", () => {
          this.value = this._value;
        }), this.on("confirm", (i2) => {
          this.output.write(import_sisteransi.cursor.move(0, -1)), this.value = i2, this.state = "submit", this.close();
        }), this.on("cursor", () => {
          this.value = !this.value;
        });
      }
    };
    u$2 = class u extends y {
      options;
      cursor = 0;
      #t;
      getGroupItems(t2) {
        return this.options.filter((r2) => r2.group === t2);
      }
      isGroupSelected(t2) {
        const r2 = this.getGroupItems(t2), e = this.value;
        return e === void 0 ? false : r2.every((s) => e.includes(s.value));
      }
      toggleValue() {
        const t2 = this.options[this.cursor];
        if (t2 !== void 0)
          if (this.value === void 0 && (this.value = []), t2.group === true) {
            const r2 = t2.value, e = this.getGroupItems(r2);
            this.isGroupSelected(r2) ? this.value = this.value.filter(
              (s) => e.findIndex((i2) => i2.value === s) === -1
            ) : this.value = [...this.value, ...e.map((s) => s.value)], this.value = Array.from(new Set(this.value));
          } else {
            const r2 = this.value.includes(t2.value);
            this.value = r2 ? this.value.filter((e) => e !== t2.value) : [...this.value, t2.value];
          }
      }
      constructor(t2) {
        super(t2, false);
        const { options: r2 } = t2;
        this.#t = t2.selectableGroups !== false, this.options = Object.entries(r2).flatMap(([e, s]) => [
          { value: e, group: true, label: e },
          ...s.map((i2) => ({ ...i2, group: e }))
        ]), this.value = [...t2.initialValues ?? []], this.cursor = Math.max(
          this.options.findIndex(({ value: e }) => e === t2.cursorAt),
          this.#t ? 0 : 1
        ), this.on("cursor", (e) => {
          switch (e) {
            case "left":
            case "up": {
              this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
              const s = this.options[this.cursor]?.group === true;
              !this.#t && s && (this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1);
              break;
            }
            case "down":
            case "right": {
              this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
              const s = this.options[this.cursor]?.group === true;
              !this.#t && s && (this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1);
              break;
            }
            case "space":
              this.toggleValue();
              break;
          }
        });
      }
    };
    u$1 = class u2 extends y {
      _mask = "\u2022";
      get cursor() {
        return this._cursor;
      }
      get masked() {
        return this.userInput.replaceAll(/./g, this._mask);
      }
      get userInputWithCursor() {
        if (this.state === "submit" || this.state === "cancel")
          return this.masked;
        const t2 = this.userInput;
        if (this.cursor >= t2.length)
          return `${this.masked}${styleText(["inverse", "hidden"], "_")}`;
        const s = this.masked, r2 = s.slice(0, this.cursor), i2 = s.slice(this.cursor, this.cursor + 1), o = s.slice(this.cursor + 1);
        return `${r2}${styleText("inverse", i2)}${o}`;
      }
      clear() {
        this._clearUserInput();
      }
      constructor({ mask: t2, ...s }) {
        super(s), this._mask = t2 ?? "\u2022", this.on("userInput", (r2) => {
          this._setValue(r2);
        }), this.on("finalize", () => {
          this.value === void 0 && (this.value = "");
        });
      }
    };
    n$1 = class n extends y {
      options;
      cursor = 0;
      get _selectedValue() {
        return this.options[this.cursor];
      }
      changeValue() {
        const e = this._selectedValue;
        this.value = e === void 0 ? void 0 : e.value;
      }
      constructor(e) {
        super(e, false), this.options = e.options;
        const o = this.options.findIndex(({ value: s }) => s === e.initialValue), t2 = o === -1 ? 0 : o;
        this.cursor = this.options[t2]?.disabled ? findCursor(t2, 1, this.options) : t2, this.changeValue(), this.on("cursor", (s) => {
          switch (s) {
            case "left":
            case "up":
              this.cursor = findCursor(this.cursor, -1, this.options);
              break;
            case "down":
            case "right":
              this.cursor = findCursor(this.cursor, 1, this.options);
              break;
          }
          this.changeValue();
        });
      }
    };
    n2 = class extends y {
      get userInputWithCursor() {
        if (this.state === "submit")
          return this.userInput;
        const t2 = this.userInput;
        if (this.cursor >= t2.length)
          return `${this.userInput}\u2588`;
        const r2 = t2.slice(0, this.cursor), s = t2.slice(this.cursor, this.cursor + 1), e = t2.slice(this.cursor + 1);
        return `${r2}${styleText("inverse", s)}${e}`;
      }
      get cursor() {
        return this._cursor;
      }
      constructor(t2) {
        super({
          ...t2,
          initialUserInput: t2.initialUserInput ?? t2.initialValue
        }), this.on("userInput", (r2) => {
          this._setValue(r2);
        }), this.on("finalize", () => {
          this.value || (this.value = t2.defaultValue), this.value === void 0 && (this.value = "");
        });
      }
    };
  }
});

// node_modules/@clack/prompts/dist/index.mjs
import { styleText as styleText2, stripVTControlCharacters } from "node:util";
import process$1 from "node:process";
function isUnicodeSupported() {
  if (process$1.platform !== "win32") {
    return process$1.env.TERM !== "linux";
  }
  return Boolean(process$1.env.CI) || Boolean(process$1.env.WT_SESSION) || Boolean(process$1.env.TERMINUS_SUBLIME) || process$1.env.ConEmuTask === "{cmd::Cmder}" || process$1.env.TERM_PROGRAM === "Terminus-Sublime" || process$1.env.TERM_PROGRAM === "vscode" || process$1.env.TERM === "xterm-256color" || process$1.env.TERM === "alacritty" || process$1.env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}
function formatInstructionFooter(o, e) {
  const r2 = [`${e ? `${styleText2("cyan", S_BAR)}  ` : ""}${o.join(" \u2022 ")}`];
  return e && r2.push(styleText2("cyan", S_BAR_END)), r2;
}
var import_sisteransi2, unicode, isCI, unicodeOr, S_STEP_ACTIVE, S_STEP_CANCEL, S_STEP_ERROR, S_STEP_SUBMIT, S_BAR_START, S_BAR, S_BAR_END, S_BAR_START_RIGHT, S_BAR_END_RIGHT, S_RADIO_ACTIVE, S_RADIO_INACTIVE, S_CHECKBOX_ACTIVE, S_CHECKBOX_SELECTED, S_CHECKBOX_INACTIVE, S_PASSWORD_MASK, S_BAR_H, S_CORNER_TOP_RIGHT, S_CONNECT_LEFT, S_CORNER_BOTTOM_RIGHT, S_CORNER_BOTTOM_LEFT, S_CORNER_TOP_LEFT, S_INFO, S_SUCCESS, S_WARN, S_ERROR, symbol, symbolBar, I, limitOptions, confirm, MULTISELECT_INSTRUCTIONS, groupMultiselect, log, cancel, intro, outro, W$1, C, note, password, W, spinner, u4, SELECT_INSTRUCTIONS, c, select, i, text;
var init_dist4 = __esm({
  "node_modules/@clack/prompts/dist/index.mjs"() {
    init_dist3();
    init_dist3();
    init_main();
    init_dist2();
    import_sisteransi2 = __toESM(require_src(), 1);
    unicode = isUnicodeSupported();
    isCI = () => process.env.CI === "true";
    unicodeOr = (o, e) => unicode ? o : e;
    S_STEP_ACTIVE = unicodeOr("\u25C6", "*");
    S_STEP_CANCEL = unicodeOr("\u25A0", "x");
    S_STEP_ERROR = unicodeOr("\u25B2", "x");
    S_STEP_SUBMIT = unicodeOr("\u25C7", "o");
    S_BAR_START = unicodeOr("\u250C", "T");
    S_BAR = unicodeOr("\u2502", "|");
    S_BAR_END = unicodeOr("\u2514", "\u2014");
    S_BAR_START_RIGHT = unicodeOr("\u2510", "T");
    S_BAR_END_RIGHT = unicodeOr("\u2518", "\u2014");
    S_RADIO_ACTIVE = unicodeOr("\u25CF", ">");
    S_RADIO_INACTIVE = unicodeOr("\u25CB", " ");
    S_CHECKBOX_ACTIVE = unicodeOr("\u25FB", "[\u2022]");
    S_CHECKBOX_SELECTED = unicodeOr("\u25FC", "[+]");
    S_CHECKBOX_INACTIVE = unicodeOr("\u25FB", "[ ]");
    S_PASSWORD_MASK = unicodeOr("\u25AA", "\u2022");
    S_BAR_H = unicodeOr("\u2500", "-");
    S_CORNER_TOP_RIGHT = unicodeOr("\u256E", "+");
    S_CONNECT_LEFT = unicodeOr("\u251C", "+");
    S_CORNER_BOTTOM_RIGHT = unicodeOr("\u256F", "+");
    S_CORNER_BOTTOM_LEFT = unicodeOr("\u2570", "+");
    S_CORNER_TOP_LEFT = unicodeOr("\u256D", "+");
    S_INFO = unicodeOr("\u25CF", "\u2022");
    S_SUCCESS = unicodeOr("\u25C6", "*");
    S_WARN = unicodeOr("\u25B2", "!");
    S_ERROR = unicodeOr("\u25A0", "x");
    symbol = (o) => {
      switch (o) {
        case "initial":
        case "active":
          return styleText2("cyan", S_STEP_ACTIVE);
        case "cancel":
          return styleText2("red", S_STEP_CANCEL);
        case "error":
          return styleText2("yellow", S_STEP_ERROR);
        case "submit":
          return styleText2("green", S_STEP_SUBMIT);
        case "validating":
          return styleText2("dim", S_STEP_ACTIVE);
      }
    };
    symbolBar = (o) => {
      switch (o) {
        case "initial":
        case "active":
          return styleText2("cyan", S_BAR);
        case "cancel":
          return styleText2("red", S_BAR);
        case "error":
          return styleText2("yellow", S_BAR);
        case "submit":
          return styleText2("green", S_BAR);
      }
    };
    I = (l2, e, w, p, b, C2 = false) => {
      let r2 = e, O = 0;
      if (C2)
        for (let i2 = p - 1; i2 >= w; i2--) {
          const m = l2[i2];
          if (m && (r2 -= m.length), O++, r2 <= b) break;
        }
      else
        for (let i2 = w; i2 < p; i2++) {
          const m = l2[i2];
          if (m && (r2 -= m.length), O++, r2 <= b) break;
        }
      return { lineCount: r2, removals: O };
    };
    limitOptions = ({
      cursor: l2,
      options: e,
      style: w,
      output: p = process.stdout,
      maxItems: b = Number.POSITIVE_INFINITY,
      columnPadding: C2 = 0,
      rowPadding: r2 = 4
    }) => {
      const i2 = getColumns(p) - C2, m = getRows(p), M = styleText2("dim", "..."), v = Math.max(m - r2, 0), a2 = Math.max(Math.min(b, v), 5);
      let f = 0;
      l2 >= a2 - 3 && (f = Math.max(
        Math.min(l2 - a2 + 3, e.length - a2),
        0
      ));
      let d = a2 < e.length && f > 0, c2 = a2 < e.length && f + a2 < e.length;
      const W2 = Math.min(
        f + a2,
        e.length
      ), s = [];
      let g = 0;
      d && g++, c2 && g++;
      const T = f + (d ? 1 : 0), y2 = W2 - (c2 ? 1 : 0);
      for (let t2 = T; t2 < y2; t2++) {
        const n3 = e[t2], o = n3 ? w(n3, t2 === l2) : "", h2 = wrapAnsi(o, i2, {
          hard: true,
          trim: false
        }).split(`
`);
        s.push(h2), g += h2.length;
      }
      if (g > v) {
        let t2 = 0, n3 = 0, o = g;
        const h2 = l2 - T;
        let u5 = v;
        const L = () => I(s, o, 0, h2, u5), E = () => I(
          s,
          o,
          h2 + 1,
          s.length,
          u5,
          true
        );
        d ? ({ lineCount: o, removals: t2 } = L(), o > u5 && (c2 || (u5 -= 1), { lineCount: o, removals: n3 } = E())) : (c2 || (u5 -= 1), { lineCount: o, removals: n3 } = E(), o > u5 && (u5 -= 1, { lineCount: o, removals: t2 } = L())), t2 > 0 && (d = true, s.splice(0, t2)), n3 > 0 && (c2 = true, s.splice(s.length - n3, n3));
      }
      const x = [];
      d && x.push(M);
      for (const t2 of s)
        for (const n3 of t2)
          x.push(n3);
      return c2 && x.push(M), x;
    };
    confirm = (e) => {
      const a2 = e.active ?? "Yes", o = e.inactive ?? "No";
      return new r({
        active: a2,
        inactive: o,
        signal: e.signal,
        input: e.input,
        output: e.output,
        initialValue: e.initialValue ?? true,
        render() {
          const i2 = e.withGuide ?? settings.withGuide, u5 = `${symbol(this.state)}  `, l2 = i2 ? `${styleText2("gray", S_BAR)}  ` : "", f = wrapTextWithPrefix(
            e.output,
            e.message,
            l2,
            u5
          ), s = `${i2 ? `${styleText2("gray", S_BAR)}
` : ""}${f}
`, c2 = this.value ? a2 : o;
          switch (this.state) {
            case "submit": {
              const r2 = i2 ? `${styleText2("gray", S_BAR)}  ` : "";
              return `${s}${r2}${styleText2("dim", c2)}`;
            }
            case "cancel": {
              const r2 = i2 ? `${styleText2("gray", S_BAR)}  ` : "";
              return `${s}${r2}${styleText2(["strikethrough", "dim"], c2)}${i2 ? `
${styleText2("gray", S_BAR)}` : ""}`;
            }
            default: {
              const r2 = i2 ? `${styleText2("cyan", S_BAR)}  ` : "", g = i2 ? styleText2("cyan", S_BAR_END) : "";
              return `${s}${r2}${this.value ? `${styleText2("green", S_RADIO_ACTIVE)} ${a2}` : `${styleText2("dim", S_RADIO_INACTIVE)} ${styleText2("dim", a2)}`}${e.vertical ? i2 ? `
${styleText2("cyan", S_BAR)}  ` : `
` : ` ${styleText2("dim", "/")} `}${this.value ? `${styleText2("dim", S_RADIO_INACTIVE)} ${styleText2("dim", o)}` : `${styleText2("green", S_RADIO_ACTIVE)} ${o}`}
${g}
`;
            }
          }
        }
      }).prompt();
    };
    MULTISELECT_INSTRUCTIONS = [
      `${styleText2("dim", "\u2191/\u2193")} to navigate`,
      `${styleText2("dim", "Space:")} select`,
      `${styleText2("dim", "Enter:")} confirm`
    ];
    groupMultiselect = (o) => {
      const { selectableGroups: f = true, groupSpacing: x = 0 } = o, d = (n3, l2, p = []) => {
        const a2 = n3.label ?? String(n3.value), t2 = typeof n3.group == "string", s = t2 && (p[p.indexOf(n3) + 1] ?? { group: true }), u5 = t2 && s && s.group === true;
        let r2 = "", c2 = "";
        t2 && (f ? (r2 = u5 ? `${S_BAR_END} ` : `${S_BAR} `, c2 = u5 ? "  " : `${S_BAR} `) : r2 = "  ");
        let i2 = "";
        if (x > 0 && !t2 && (i2 = `
`.repeat(x)), l2 === "active")
          return wrapTextWithPrefix(
            o.output,
            `${a2}${n3.hint ? ` ${styleText2("dim", `(${n3.hint})`)}` : ""}`,
            `${i2}${styleText2("dim", r2)} `,
            `${i2}${styleText2("dim", r2)}${styleText2("cyan", S_CHECKBOX_ACTIVE)} `,
            `${i2}${styleText2("dim", c2)} `
          );
        if (l2 === "group-active")
          return wrapTextWithPrefix(
            o.output,
            a2,
            `${i2}${r2} `,
            `${i2}${r2}${styleText2("cyan", S_CHECKBOX_ACTIVE)} `,
            `${i2}${c2} `,
            (m) => styleText2("dim", m)
          );
        if (l2 === "group-active-selected")
          return wrapTextWithPrefix(
            o.output,
            a2,
            `${i2}${r2} `,
            `${i2}${r2}${styleText2("green", S_CHECKBOX_SELECTED)} `,
            `${i2}${c2} `,
            (m) => styleText2("dim", m)
          );
        if (l2 === "selected") {
          const m = t2 || f ? styleText2("green", S_CHECKBOX_SELECTED) : "";
          return wrapTextWithPrefix(
            o.output,
            `${a2}${n3.hint ? ` (${n3.hint})` : ""}`,
            `${i2}${styleText2("dim", r2)} `,
            `${i2}${styleText2("dim", r2)}${m} `,
            `${i2}${styleText2("dim", c2)} `,
            (I2) => styleText2("dim", I2)
          );
        }
        if (l2 === "cancelled")
          return `${styleText2(["strikethrough", "dim"], a2)}`;
        if (l2 === "active-selected")
          return wrapTextWithPrefix(
            o.output,
            `${a2}${n3.hint ? ` ${styleText2("dim", `(${n3.hint})`)}` : ""}`,
            `${i2}${styleText2("dim", r2)} `,
            `${i2}${styleText2("dim", r2)}${styleText2("green", S_CHECKBOX_SELECTED)} `,
            `${i2}${styleText2("dim", c2)} `
          );
        if (l2 === "submitted")
          return `${styleText2("dim", a2)}`;
        const h2 = t2 || f ? styleText2("dim", S_CHECKBOX_INACTIVE) : "";
        return wrapTextWithPrefix(
          o.output,
          a2,
          `${i2}${styleText2("dim", r2)} `,
          `${i2}${styleText2("dim", r2)}${h2} `,
          `${i2}${styleText2("dim", c2)} `,
          (m) => styleText2("dim", m)
        );
      }, y2 = o.required ?? true, S2 = o.showInstructions ?? true;
      return new u$2({
        options: o.options,
        signal: o.signal,
        input: o.input,
        output: o.output,
        initialValues: o.initialValues,
        required: y2,
        cursorAt: o.cursorAt,
        selectableGroups: f,
        validate(n3) {
          if (y2 && (n3 === void 0 || n3.length === 0))
            return `Please select at least one option.
${styleText2(
              "reset",
              styleText2(
                "dim",
                `Press ${styleText2(["gray", "bgWhite", "inverse"], " space ")} to select, ${styleText2(
                  "gray",
                  styleText2(["bgWhite", "inverse"], " enter ")
                )} to submit`
              )
            )}`;
        },
        render() {
          const n3 = o.withGuide ?? settings.withGuide, l2 = `${n3 ? `${styleText2("gray", S_BAR)}
` : ""}${symbol(this.state)}  ${o.message}
`, p = this.value ?? [], a2 = (t2, s) => {
            const u5 = this.options, r2 = p.includes(t2.value) || t2.group === true && this.isGroupSelected(`${t2.value}`);
            return !s && typeof t2.group == "string" && this.options[this.cursor]?.value === t2.group ? d(t2, r2 ? "group-active-selected" : "group-active", u5) : s && r2 ? d(t2, "active-selected", u5) : r2 ? d(t2, "selected", u5) : d(t2, s ? "active" : "inactive", u5);
          };
          switch (this.state) {
            case "submit": {
              const t2 = this.options.filter(({ value: u5 }) => p.includes(u5)).map((u5) => d(u5, "submitted")), s = t2.length === 0 ? "" : `  ${t2.join(styleText2("dim", ", "))}`;
              return `${l2}${n3 ? styleText2("gray", S_BAR) : ""}${s}`;
            }
            case "cancel": {
              const t2 = this.options.filter(({ value: s }) => p.includes(s)).map((s) => d(s, "cancelled")).join(styleText2("dim", ", "));
              return `${l2}${n3 ? `${styleText2("gray", S_BAR)}  ` : ""}${t2.trim() ? `${t2}${n3 ? `
${styleText2("gray", S_BAR)}` : ""}` : ""}`;
            }
            case "error": {
              const t2 = n3 ? `${styleText2("yellow", S_BAR)}  ` : "", s = this.error.split(`
`).map(
                (i2, h2) => h2 === 0 ? `${n3 ? `${styleText2("yellow", S_BAR_END)}  ` : ""}${styleText2("yellow", i2)}` : `   ${i2}`
              ).join(`
`), u5 = l2.split(`
`).length, r2 = s.split(`
`).length + 1, c2 = limitOptions({
                output: o.output,
                options: this.options,
                cursor: this.cursor,
                maxItems: o.maxItems,
                columnPadding: t2.length,
                rowPadding: u5 + r2,
                style: a2
              }).join(`
${t2}`);
              return `${l2}${t2}${c2}
${s}
`;
            }
            default: {
              const t2 = n3 ? `${styleText2("cyan", S_BAR)}  ` : "", s = l2.split(`
`).length, u5 = S2 ? formatInstructionFooter(MULTISELECT_INSTRUCTIONS, n3) : n3 ? [styleText2("cyan", S_BAR_END)] : [], r2 = u5.join(`
`), c2 = u5.length + 1, i2 = limitOptions({
                output: o.output,
                options: this.options,
                cursor: this.cursor,
                maxItems: o.maxItems,
                columnPadding: t2.length,
                rowPadding: s + c2,
                style: a2
              }).join(`
${t2}`);
              return `${l2}${t2}${i2}
${r2}
`;
            }
          }
        }
      }).prompt();
    };
    log = {
      message: (s = [], {
        symbol: e = styleText2("gray", S_BAR),
        secondarySymbol: r2 = styleText2("gray", S_BAR),
        output: m = process.stdout,
        spacing: l2 = 1,
        withGuide: c2
      } = {}) => {
        const t2 = [], o = c2 ?? settings.withGuide, f = o ? r2 : "", O = o ? `${e}  ` : "", u5 = o ? `${r2}  ` : "";
        for (let i2 = 0; i2 < l2; i2++)
          t2.push(f);
        const g = Array.isArray(s) ? s : s.split(`
`);
        if (g.length > 0) {
          const [i2, ...y2] = g;
          i2.length > 0 ? t2.push(`${O}${i2}`) : t2.push(o ? e : "");
          for (const p of y2)
            p.length > 0 ? t2.push(`${u5}${p}`) : t2.push(o ? r2 : "");
        }
        m.write(`${t2.join(`
`)}
`);
      },
      info: (s, e) => {
        log.message(s, { ...e, symbol: styleText2("blue", S_INFO) });
      },
      success: (s, e) => {
        log.message(s, { ...e, symbol: styleText2("green", S_SUCCESS) });
      },
      step: (s, e) => {
        log.message(s, { ...e, symbol: styleText2("green", S_STEP_SUBMIT) });
      },
      warn: (s, e) => {
        log.message(s, { ...e, symbol: styleText2("yellow", S_WARN) });
      },
      /** alias for `log.warn()`. */
      warning: (s, e) => {
        log.warn(s, e);
      },
      error: (s, e) => {
        log.message(s, { ...e, symbol: styleText2("red", S_ERROR) });
      }
    };
    cancel = (o = "", t2) => {
      const i2 = t2?.output ?? process.stdout, e = t2?.withGuide ?? settings.withGuide ? `${styleText2("gray", S_BAR_END)}  ` : "";
      i2.write(`${e}${styleText2("red", o)}

`);
    };
    intro = (o = "", t2) => {
      const i2 = t2?.output ?? process.stdout, e = t2?.withGuide ?? settings.withGuide ? `${styleText2("gray", S_BAR_START)}  ` : "";
      i2.write(`${e}${o}
`);
    };
    outro = (o = "", t2) => {
      const i2 = t2?.output ?? process.stdout, e = t2?.withGuide ?? settings.withGuide ? `${styleText2("gray", S_BAR)}
${styleText2("gray", S_BAR_END)}  ` : "";
      i2.write(`${e}${o}

`);
    };
    W$1 = (o) => o;
    C = (o, e, s) => {
      const a2 = {
        hard: true,
        trim: false
      }, i2 = wrapAnsi(o, e, a2).split(`
`), c2 = i2.reduce((n3, t2) => Math.max(dist_default2(t2), n3), 0), u5 = i2.map(s).reduce((n3, t2) => Math.max(dist_default2(t2), n3), 0), g = e - (u5 - c2);
      return wrapAnsi(o, g, a2);
    };
    note = (o = "", e = "", s) => {
      const a2 = s?.output ?? process$1.stdout, i2 = s?.withGuide ?? settings.withGuide, c2 = s?.format ?? W$1, g = ["", ...C(o, getColumns(a2) - 6, c2).split(`
`).map(c2), ""], n3 = dist_default2(e), t2 = Math.max(
        g.reduce((m, F) => {
          const O = dist_default2(F);
          return O > m ? O : m;
        }, 0),
        n3
      ) + 2, h2 = g.map(
        (m) => `${styleText2("gray", S_BAR)}  ${m}${" ".repeat(t2 - dist_default2(m))}${styleText2("gray", S_BAR)}`
      ).join(`
`), T = i2 ? `${styleText2("gray", S_BAR)}
` : "", l$1 = i2 ? S_CONNECT_LEFT : S_CORNER_BOTTOM_LEFT;
      a2.write(
        `${T}${styleText2("green", S_STEP_SUBMIT)}  ${styleText2("reset", e)} ${styleText2(
          "gray",
          S_BAR_H.repeat(Math.max(t2 - n3 - 1, 1)) + S_CORNER_TOP_RIGHT
        )}
${h2}
${styleText2("gray", l$1 + S_BAR_H.repeat(t2 + 2) + S_CORNER_BOTTOM_RIGHT)}
`
      );
    };
    password = (e) => new u$1({
      validate: e.validate,
      mask: e.mask ?? S_PASSWORD_MASK,
      signal: e.signal,
      input: e.input,
      output: e.output,
      render() {
        const r2 = e.withGuide ?? settings.withGuide, o = `${r2 ? `${styleText2("gray", S_BAR)}
` : ""}${symbol(this.state)}  ${e.message}
`, m = this.userInputWithCursor, i2 = this.masked;
        switch (this.state) {
          case "error": {
            const s = r2 ? `${styleText2("yellow", S_BAR)}  ` : "", n3 = r2 ? `${styleText2("yellow", S_BAR_END)}  ` : "", d = i2 ?? "";
            return e.clearOnError && this.clear(), `${o.trim()}
${s}${d}
${n3}${styleText2("yellow", this.error)}
`;
          }
          case "submit": {
            const s = r2 ? `${styleText2("gray", S_BAR)}  ` : "", n3 = i2 ? styleText2("dim", i2) : "";
            return `${o}${s}${n3}`;
          }
          case "cancel": {
            const s = r2 ? `${styleText2("gray", S_BAR)}  ` : "", n3 = i2 ? styleText2(["strikethrough", "dim"], i2) : "";
            return `${o}${s}${n3}${i2 && r2 ? `
${styleText2("gray", S_BAR)}` : ""}`;
          }
          default: {
            const s = r2 ? `${styleText2("cyan", S_BAR)}  ` : "", n3 = r2 ? styleText2("cyan", S_BAR_END) : "";
            return `${o}${s}${m}
${n3}
`;
          }
        }
      }
    }).prompt();
    W = (l2) => styleText2("magenta", l2);
    spinner = ({
      indicator: l2 = "dots",
      onCancel: h2,
      output: n3 = process.stdout,
      cancelMessage: G,
      errorMessage: O,
      frames: E = unicode ? ["\u25D2", "\u25D0", "\u25D3", "\u25D1"] : ["\u2022", "o", "O", "0"],
      delay: F = unicode ? 80 : 120,
      signal: m,
      ...I2
    } = {}) => {
      const u5 = isCI();
      let M, T, d = false, S2 = false, s = "", p, w = performance.now();
      const x = getColumns(n3), k = I2?.styleFrame ?? W, g = (e) => {
        const r2 = e > 1 ? O ?? settings.messages.error : G ?? settings.messages.cancel;
        S2 = e === 1, d && (a2(r2, e), S2 && typeof h2 == "function" && h2());
      }, f = () => g(2), i2 = () => g(1), A = () => {
        process.on("uncaughtExceptionMonitor", f), process.on("unhandledRejection", f), process.on("SIGINT", i2), process.on("SIGTERM", i2), process.on("exit", g), m && m.addEventListener("abort", i2);
      }, H = () => {
        process.removeListener("uncaughtExceptionMonitor", f), process.removeListener("unhandledRejection", f), process.removeListener("SIGINT", i2), process.removeListener("SIGTERM", i2), process.removeListener("exit", g), m && m.removeEventListener("abort", i2);
      }, y2 = () => {
        if (p === void 0) return;
        u5 && n3.write(`
`);
        const r2 = wrapAnsi(p, x, {
          hard: true,
          trim: false
        }).split(`
`);
        r2.length > 1 && n3.write(import_sisteransi2.cursor.up(r2.length - 1)), n3.write(import_sisteransi2.cursor.to(0)), n3.write(import_sisteransi2.erase.down());
      }, C2 = (e) => e.replace(/\.+$/, ""), _ = (e) => {
        const r2 = (performance.now() - e) / 1e3, t2 = Math.floor(r2 / 60), o = Math.floor(r2 % 60);
        return t2 > 0 ? `[${t2}m ${o}s]` : `[${o}s]`;
      }, N = I2.withGuide ?? settings.withGuide, P = (e = "") => {
        d = true, M = block({ output: n3 }), s = C2(e), w = performance.now(), N && n3.write(`${styleText2("gray", S_BAR)}
`);
        let r2 = 0, t2 = 0;
        A(), T = setInterval(() => {
          if (u5 && s === p)
            return;
          y2(), p = s;
          const o = k(E[r2]);
          let v;
          if (u5)
            v = `${o}  ${s}...`;
          else if (l2 === "timer")
            v = `${o}  ${s} ${_(w)}`;
          else {
            const B = ".".repeat(Math.floor(t2)).slice(0, 3);
            v = `${o}  ${s}${B}`;
          }
          const j = wrapAnsi(v, x, {
            hard: true,
            trim: false
          });
          n3.write(j), r2 = r2 + 1 < E.length ? r2 + 1 : 0, t2 = t2 < 4 ? t2 + 0.125 : 0;
        }, F);
      }, a2 = (e = "", r2 = 0, t2 = false) => {
        if (!d) return;
        d = false, clearInterval(T), y2();
        const o = r2 === 0 ? styleText2("green", S_STEP_SUBMIT) : r2 === 1 ? styleText2("red", S_STEP_CANCEL) : styleText2("red", S_STEP_ERROR);
        s = e ?? s, t2 || (l2 === "timer" ? n3.write(`${o}  ${s} ${_(w)}
`) : n3.write(`${o}  ${s}
`)), H(), M();
      };
      return {
        start: P,
        stop: (e = "") => a2(e, 0),
        message: (e = "") => {
          s = C2(e ?? s);
        },
        cancel: (e = "") => a2(e, 1),
        error: (e = "") => a2(e, 2),
        clear: () => a2("", 0, true),
        get isCancelled() {
          return S2;
        }
      };
    };
    u4 = {
      light: unicodeOr("\u2500", "-"),
      heavy: unicodeOr("\u2501", "="),
      block: unicodeOr("\u2588", "#")
    };
    SELECT_INSTRUCTIONS = [
      `${styleText2("dim", "\u2191/\u2193")} to navigate`,
      `${styleText2("dim", "Enter:")} confirm`
    ];
    c = (t2, o) => t2.includes(`
`) ? t2.split(`
`).map((d) => o(d)).join(`
`) : o(t2);
    select = (t2) => {
      const o = (n3, m) => {
        if (n3 === void 0)
          return "";
        const s = n3.label ?? String(n3.value);
        switch (m) {
          case "disabled":
            return `${styleText2("gray", S_RADIO_INACTIVE)} ${c(s, (i2) => styleText2("gray", i2))}${n3.hint ? ` ${styleText2("dim", `(${n3.hint ?? "disabled"})`)}` : ""}`;
          case "selected":
            return `${c(s, (i2) => styleText2("dim", i2))}`;
          case "active":
            return `${styleText2("green", S_RADIO_ACTIVE)} ${s}${n3.hint ? ` ${styleText2("dim", `(${n3.hint})`)}` : ""}`;
          case "cancelled":
            return `${c(s, (i2) => styleText2(["strikethrough", "dim"], i2))}`;
          default:
            return `${styleText2("dim", S_RADIO_INACTIVE)} ${c(s, (i2) => styleText2("dim", i2))}`;
        }
      }, d = t2.showInstructions ?? true;
      return new n$1({
        options: t2.options,
        signal: t2.signal,
        input: t2.input,
        output: t2.output,
        initialValue: t2.initialValue,
        render() {
          const n3 = t2.withGuide ?? settings.withGuide, m = `${symbol(this.state)}  `, s = `${symbolBar(this.state)}  `, i2 = wrapTextWithPrefix(
            t2.output,
            t2.message,
            s,
            m
          ), u5 = `${n3 ? `${styleText2("gray", S_BAR)}
` : ""}${i2}
`;
          switch (this.state) {
            case "submit": {
              const r2 = n3 ? `${styleText2("gray", S_BAR)}  ` : "", a2 = wrapTextWithPrefix(
                t2.output,
                o(this.options[this.cursor], "selected"),
                r2
              );
              return `${u5}${a2}`;
            }
            case "cancel": {
              const r2 = n3 ? `${styleText2("gray", S_BAR)}  ` : "", a2 = wrapTextWithPrefix(
                t2.output,
                o(this.options[this.cursor], "cancelled"),
                r2
              );
              return `${u5}${a2}${n3 ? `
${styleText2("gray", S_BAR)}` : ""}`;
            }
            default: {
              const r2 = n3 ? `${styleText2("cyan", S_BAR)}  ` : "", a2 = u5.split(`
`).length, p = d ? formatInstructionFooter(SELECT_INSTRUCTIONS, n3) : n3 ? [styleText2("cyan", S_BAR_END)] : [], f = p.join(`
`), b = p.length + 1;
              return `${u5}${r2}${limitOptions({
                output: t2.output,
                cursor: this.cursor,
                options: this.options,
                maxItems: t2.maxItems,
                columnPadding: r2.length,
                rowPadding: a2 + b,
                style: (g, x) => o(g, g.disabled ? "disabled" : x ? "active" : "inactive")
              }).join(`
${r2}`)}
${f}
`;
            }
          }
        }
      }).prompt();
    };
    i = `${styleText2("gray", S_BAR)}  `;
    text = (t2) => new n2({
      validate: t2.validate,
      placeholder: t2.placeholder,
      defaultValue: t2.defaultValue,
      initialValue: t2.initialValue,
      output: t2.output,
      signal: t2.signal,
      input: t2.input,
      render() {
        const r2 = t2?.withGuide ?? settings.withGuide, l2 = `${`${r2 ? `${styleText2("gray", S_BAR)}
` : ""}${symbol(this.state)}  `}${t2.message}
`, d = t2.placeholder && t2.placeholder.length > 0 ? (
          // biome-ignore lint/style/noNonNullAssertion: guarded by placeholder.length > 0
          styleText2("inverse", t2.placeholder[0]) + styleText2("dim", t2.placeholder.slice(1))
        ) : styleText2(["inverse", "hidden"], "_"), o = this.userInput ? this.userInputWithCursor : d, s = this.value ?? "";
        switch (this.state) {
          case "validating": {
            const n3 = r2 ? `${styleText2("cyan", S_BAR)}  ` : "", i2 = r2 ? styleText2("cyan", S_BAR_END) : "", c2 = styleText2("dim", o), $ = styleText2("dim", "Validating...");
            return `${l2}${n3}${c2}
${i2}  ${$}
`;
          }
          case "error": {
            const n3 = this.error ? `  ${styleText2("yellow", this.error)}` : "", i2 = r2 ? `${styleText2("yellow", S_BAR)}  ` : "", c2 = r2 ? styleText2("yellow", S_BAR_END) : "";
            return `${l2.trim()}
${i2}${o}
${c2}${n3}
`;
          }
          case "submit": {
            const n3 = s ? `${r2 ? "  " : ""}${styleText2("dim", s)}` : "", i2 = r2 ? styleText2("gray", S_BAR) : "";
            return `${l2}${i2}${n3}`;
          }
          case "cancel": {
            const n3 = s ? `  ${styleText2(["strikethrough", "dim"], s)}` : "", i2 = r2 ? styleText2("gray", S_BAR) : "";
            return `${l2}${i2}${n3}${s.trim() ? `
${i2}` : ""}`;
          }
          default: {
            const n3 = r2 ? `${styleText2("cyan", S_BAR)}  ` : "", i2 = r2 ? styleText2("cyan", S_BAR_END) : "";
            return `${l2}${n3}${o}
${i2}
`;
          }
        }
      }
    }).prompt();
  }
});

// node_modules/picocolors/picocolors.js
var require_picocolors = __commonJS({
  "node_modules/picocolors/picocolors.js"(exports, module) {
    var p = process || {};
    var argv = p.argv || [];
    var env2 = p.env || {};
    var isColorSupported = !(!!env2.NO_COLOR || argv.includes("--no-color")) && (!!env2.FORCE_COLOR || argv.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env2.TERM !== "dumb" || !!env2.CI);
    var formatter = (open, close, replace = open) => (input) => {
      let string = "" + input, index = string.indexOf(close, open.length);
      return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
    };
    var replaceClose = (string, close, replace, index) => {
      let result = "", cursor3 = 0;
      do {
        result += string.substring(cursor3, index) + replace;
        cursor3 = index + close.length;
        index = string.indexOf(close, cursor3);
      } while (~index);
      return result + string.substring(cursor3);
    };
    var createColors = (enabled = isColorSupported) => {
      let f = enabled ? formatter : () => String;
      return {
        isColorSupported: enabled,
        reset: f("\x1B[0m", "\x1B[0m"),
        bold: f("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
        dim: f("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
        italic: f("\x1B[3m", "\x1B[23m"),
        underline: f("\x1B[4m", "\x1B[24m"),
        inverse: f("\x1B[7m", "\x1B[27m"),
        hidden: f("\x1B[8m", "\x1B[28m"),
        strikethrough: f("\x1B[9m", "\x1B[29m"),
        black: f("\x1B[30m", "\x1B[39m"),
        red: f("\x1B[31m", "\x1B[39m"),
        green: f("\x1B[32m", "\x1B[39m"),
        yellow: f("\x1B[33m", "\x1B[39m"),
        blue: f("\x1B[34m", "\x1B[39m"),
        magenta: f("\x1B[35m", "\x1B[39m"),
        cyan: f("\x1B[36m", "\x1B[39m"),
        white: f("\x1B[37m", "\x1B[39m"),
        gray: f("\x1B[90m", "\x1B[39m"),
        bgBlack: f("\x1B[40m", "\x1B[49m"),
        bgRed: f("\x1B[41m", "\x1B[49m"),
        bgGreen: f("\x1B[42m", "\x1B[49m"),
        bgYellow: f("\x1B[43m", "\x1B[49m"),
        bgBlue: f("\x1B[44m", "\x1B[49m"),
        bgMagenta: f("\x1B[45m", "\x1B[49m"),
        bgCyan: f("\x1B[46m", "\x1B[49m"),
        bgWhite: f("\x1B[47m", "\x1B[49m"),
        blackBright: f("\x1B[90m", "\x1B[39m"),
        redBright: f("\x1B[91m", "\x1B[39m"),
        greenBright: f("\x1B[92m", "\x1B[39m"),
        yellowBright: f("\x1B[93m", "\x1B[39m"),
        blueBright: f("\x1B[94m", "\x1B[39m"),
        magentaBright: f("\x1B[95m", "\x1B[39m"),
        cyanBright: f("\x1B[96m", "\x1B[39m"),
        whiteBright: f("\x1B[97m", "\x1B[39m"),
        bgBlackBright: f("\x1B[100m", "\x1B[49m"),
        bgRedBright: f("\x1B[101m", "\x1B[49m"),
        bgGreenBright: f("\x1B[102m", "\x1B[49m"),
        bgYellowBright: f("\x1B[103m", "\x1B[49m"),
        bgBlueBright: f("\x1B[104m", "\x1B[49m"),
        bgMagentaBright: f("\x1B[105m", "\x1B[49m"),
        bgCyanBright: f("\x1B[106m", "\x1B[49m"),
        bgWhiteBright: f("\x1B[107m", "\x1B[49m")
      };
    };
    module.exports = createColors();
    module.exports.createColors = createColors;
  }
});

// src/ui.ts
import { createInterface as createInterface2 } from "node:readline";
function nextAnswer() {
  return scripted && scripted.length ? scripted.shift() : void 0;
}
function info(msg = "") {
  if (collecting) {
    if (msg) collecting.push(msg);
    return;
  }
  if (!quiet) log.message(msg);
}
function ok(msg) {
  if (collecting) {
    collecting.push(msg);
    return;
  }
  if (!quiet) log.success(msg);
}
function step(msg) {
  if (collecting) {
    collecting.push(msg);
    return;
  }
  if (!quiet) log.step(msg);
}
function skip(msg) {
  if (collecting) return;
  if (!quiet) log.message(import_picocolors.default.dim("\u25CB " + msg));
}
async function group(title, fn, opts = {}) {
  const prev = collecting;
  const mine = [];
  collecting = mine;
  const useSpin = !quiet && process.stdout.isTTY && !activeSpinner;
  const sp = useSpin ? spinner() : null;
  if (sp) {
    sp.start(title);
    activeSpinner = sp;
  }
  let result;
  try {
    result = await fn();
  } catch (e) {
    if (sp) {
      sp.error(title);
      activeSpinner = null;
    }
    collecting = prev;
    throw e;
  } finally {
    collecting = prev;
  }
  if (sp) {
    sp.clear();
    activeSpinner = null;
  }
  if (quiet) return result;
  const items = mine.map((m) => m.trim()).filter(Boolean);
  const max = opts.max ?? 12;
  const lines = items.length ? items.slice(0, max).map((i2) => `${import_picocolors.default.green("\u2713")} ${clip(i2)}`) : [import_picocolors.default.dim(opts.done ?? "up to date")];
  if (items.length > max) lines.push(import_picocolors.default.dim(`\u2026 ${items.length - max} more`));
  log.success(import_picocolors.default.bold(title) + "\n" + lines.join("\n"));
  return result;
}
function warn(msg) {
  log.warn(msg);
}
function fail(msg) {
  log.error(msg);
}
function error(what, why = "", fix2 = "") {
  const lines = [import_picocolors.default.bold(what)];
  if (why) lines.push(why);
  if (fix2) lines.push(import_picocolors.default.cyan("\u2192 ") + fix2);
  log.error(lines.join("\n"));
}
function section(title) {
  if (!quiet) log.step(import_picocolors.default.bold(title));
}
function intro2(title) {
  if (!quiet) intro(import_picocolors.default.bold(title));
}
function outro2(msg) {
  if (!quiet) outro(msg);
}
function note2(lines, title) {
  if (!quiet) note(lines.join("\n"), title);
}
function kv(key, value, width2 = 14) {
  info(`${import_picocolors.default.dim(key.padEnd(width2))} ${value}`);
}
function table(rows, header) {
  if (collecting) {
    for (const r2 of rows) collecting.push(r2.join("  "));
    return;
  }
  if (quiet || !rows.length) return;
  const all = header ? [header, ...rows] : rows;
  const ncol = Math.max(...all.map((r2) => r2.length));
  const vis = (s) => s.replace(/\x1b\[[0-9;]*m/g, "").length;
  const w = Array.from({ length: ncol }, (_, i2) => Math.max(...all.map((r2) => vis(r2[i2] ?? ""))));
  const fmt = (r2) => r2.map((cell, i2) => cell + " ".repeat(w[i2] - vis(cell))).join("  ").trimEnd();
  const lines = [...header ? [import_picocolors.default.dim(fmt(header))] : [], ...rows.map(fmt)];
  log.message(lines.join("\n"));
}
function cancelled(v) {
  cancel("cancelled");
  process.exit(130);
}
async function plainLine(q) {
  const rl = createInterface2({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(q, (a2) => {
    rl.close();
    res(a2.trim());
  }));
}
async function text2(message, opts = {}) {
  const a2 = nextAnswer();
  if (a2 !== void 0) {
    const v2 = a2 === "<default>" ? opts.default ?? "" : a2;
    const err = opts.validate?.(v2);
    if (err) throw new Error(`scripted answer '${v2}' rejected for '${message}': ${err}`);
    return v2;
  }
  if (!isTTY()) {
    for (; ; ) {
      const v2 = await plainLine(`? ${message}${opts.default ? ` [${opts.default}]` : ""}: `) || (opts.default ?? "");
      const err = opts.validate?.(v2);
      if (!err) return v2;
      console.log("  ! " + err);
    }
  }
  const v = await text({
    message,
    placeholder: opts.placeholder,
    defaultValue: opts.default,
    initialValue: void 0,
    validate: (x) => {
      const val = (x ?? "").trim() || (opts.default ?? "");
      return opts.validate?.(val);
    }
  });
  if (isCancel(v)) cancelled(v);
  return String(v ?? "").trim() || (opts.default ?? "");
}
async function password2(message) {
  const a2 = nextAnswer();
  if (a2 !== void 0) return a2;
  if (!isTTY()) return plainLine(`? ${message}: `);
  const v = await password({ message });
  if (isCancel(v)) cancelled(v);
  return String(v ?? "");
}
async function confirm2(message, initial = false) {
  const a2 = nextAnswer();
  if (a2 !== void 0) return a2 === "<default>" ? initial : a2 === "y" || a2 === "yes";
  if (!isTTY()) {
    const v2 = (await plainLine(`? ${message} [${initial ? "Y/n" : "y/N"}]: `)).toLowerCase();
    return v2 ? v2.startsWith("y") : initial;
  }
  const v = await confirm({ message, initialValue: initial });
  if (isCancel(v)) cancelled(v);
  return Boolean(v);
}
async function select2(message, options, initial) {
  const a2 = nextAnswer();
  if (a2 !== void 0) {
    if (a2 === "<default>") return initial ?? options[0].value;
    const hit = options.find((o) => o.value === a2 || o.label.toLowerCase().startsWith(a2.toLowerCase()));
    if (!hit) throw new Error(`scripted answer '${a2}' matches no option for '${message}'`);
    return hit.value;
  }
  if (!isTTY()) {
    console.log(`? ${message}`);
    options.forEach((o, i3) => console.log(`  ${i3 + 1}) ${o.label}`));
    const v2 = await plainLine(`  choose [${options.findIndex((o) => o.value === initial) + 1 || 1}]: `);
    const i2 = parseInt(v2, 10);
    return i2 >= 1 && i2 <= options.length ? options[i2 - 1].value : initial ?? options[0].value;
  }
  const v = await select({ message, options, initialValue: initial });
  if (isCancel(v)) cancelled(v);
  return v;
}
async function groupMultiselect2(message, groups, initial = []) {
  const all = Object.values(groups).flat();
  const a2 = nextAnswer();
  if (a2 !== void 0) return a2 === "<default>" ? initial : a2 === "all" ? all.map((o) => o.value) : a2.split(",").map((x) => x.trim()).filter(Boolean);
  if (!isTTY()) {
    console.log(`? ${message}`);
    for (const [g, opts] of Object.entries(groups)) console.log(`  ${g}: ${opts.map((o) => o.value).join(", ")}`);
    const v2 = await plainLine(`  comma list (Enter = ${initial.length === all.length ? "all" : initial.join(",")}): `);
    return v2 ? v2.split(",").map((x) => x.trim()) : initial;
  }
  const v = await groupMultiselect({ message, options: groups, initialValues: initial, required: false, selectableGroups: true });
  if (isCancel(v)) cancelled(v);
  return v;
}
async function proceed(message, doneLabel = "Done \u2014 check again", skipLabel = "Skip for now") {
  return await select2(message, [{ value: "done", label: doneLabel }, { value: "skip", label: skipLabel }]) === "done";
}
async function spin(label, fn) {
  if (activeSpinner) {
    const outer = activeSpinner;
    outer.message(label);
    return fn((l2) => outer.message(l2));
  }
  if (quiet || !process.stdout.isTTY) return fn(() => {
  });
  const s = spinner();
  s.start(label);
  activeSpinner = s;
  try {
    const r2 = await fn((l2) => s.message(l2));
    s.stop(label);
    return r2;
  } catch (e) {
    s.error(label + " failed");
    throw e;
  } finally {
    activeSpinner = null;
  }
}
var import_picocolors, quiet, collecting, setQuiet, strip, isQuiet, isTTY, scripted, isScripted, dim, bold, green, yellow, red, cyan, gray, magenta, activeSpinner, width, clip;
var init_ui = __esm({
  "src/ui.ts"() {
    "use strict";
    init_dist4();
    import_picocolors = __toESM(require_picocolors(), 1);
    quiet = false;
    collecting = null;
    setQuiet = (q) => {
      quiet = q;
    };
    strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");
    isQuiet = () => quiet;
    isTTY = () => Boolean(process.stdin.isTTY && process.stdout.isTTY);
    scripted = process.env.CS_ANSWERS ? JSON.parse(process.env.CS_ANSWERS) : null;
    isScripted = () => scripted !== null;
    dim = import_picocolors.default.dim;
    bold = import_picocolors.default.bold;
    green = import_picocolors.default.green;
    yellow = import_picocolors.default.yellow;
    red = import_picocolors.default.red;
    cyan = import_picocolors.default.cyan;
    gray = import_picocolors.default.gray;
    magenta = import_picocolors.default.magenta;
    activeSpinner = null;
    width = () => Math.max(40, (process.stdout.columns || 100) - 6);
    clip = (s, w = width()) => strip(s).length > w ? s.slice(0, w - 1) + "\u2026" : s;
  }
});

// src/paths.ts
var paths_exports = {};
__export(paths_exports, {
  claudeDir: () => claudeDir,
  claudeJson: () => claudeJson,
  contract: () => contract,
  csConfigDir: () => csConfigDir,
  expand: () => expand,
  home: () => home,
  isUnder: () => isUnder,
  machineFile: () => machineFile,
  nodename: () => nodename,
  repoDirDefault: () => repoDirDefault,
  stateDir: () => stateDir,
  templatesDir: () => templatesDir,
  toolRoot: () => toolRoot
});
import { homedir, hostname } from "node:os";
import { join, resolve, isAbsolute, relative } from "node:path";
function expand(p) {
  let s = p.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, v) => process.env[v] ?? "");
  if (s === "~" || s.startsWith("~/")) s = home() + s.slice(1);
  return s;
}
function contract(p) {
  const h2 = home();
  if (p === h2) return "~";
  if (p.startsWith(h2 + "/")) return "~/" + p.slice(h2.length + 1);
  return p;
}
var home, claudeDir, claudeJson, csConfigDir, machineFile, repoDirDefault, stateDir, toolRoot, templatesDir, nodename, isUnder;
var init_paths = __esm({
  "src/paths.ts"() {
    "use strict";
    home = () => process.env.HOME || homedir();
    claudeDir = () => process.env.CLAUDE_CONFIG_DIR || join(home(), ".claude");
    claudeJson = () => join(process.env.CLAUDE_CONFIG_DIR || home(), ".claude.json");
    csConfigDir = () => process.env.CS_CONFIG_DIR || join(home(), ".config", "claude-share");
    machineFile = () => join(csConfigDir(), "machine.toml");
    repoDirDefault = () => join(csConfigDir(), "repo");
    stateDir = () => join(process.env.XDG_STATE_HOME || join(home(), ".local", "state"), "cs");
    toolRoot = () => resolve(new URL(".", import.meta.url).pathname, "..");
    templatesDir = () => join(toolRoot(), "templates");
    nodename = () => hostname();
    isUnder = (child, parent) => {
      const r2 = relative(parent, child);
      return !!r2 && !r2.startsWith("..") && !isAbsolute(r2);
    };
  }
});

// src/platform.ts
import { readFileSync } from "node:fs";
import { join as join2 } from "node:path";
function isWSL() {
  if (!isLinux()) return false;
  try {
    return readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft");
  } catch {
    return false;
  }
}
function refuseUnsupported() {
  if (process.platform === "win32" || process.env.MSYSTEM) {
    console.error("cs: Windows-native shells are unsupported. Run inside WSL2 (`wsl --install -d Ubuntu-24.04`). See docs/WINDOWS.md.");
    process.exit(1);
  }
}
var isMac, isLinux, shellRc, describe;
var init_platform = __esm({
  "src/platform.ts"() {
    "use strict";
    init_paths();
    isMac = () => process.platform === "darwin";
    isLinux = () => process.platform === "linux";
    shellRc = () => join2(home(), isMac() ? ".zshrc" : ".bashrc");
    describe = () => isWSL() ? "wsl2" : isMac() ? "macos" : process.platform;
  }
});

// node_modules/smol-toml/dist/date.js
var DATE_TIME_RE, TomlDate;
var init_date = __esm({
  "node_modules/smol-toml/dist/date.js"() {
    DATE_TIME_RE = /^(\d{4}-\d{2}-\d{2})?[T ]?(?:(\d{2}):\d{2}(?::\d{2}(?:\.\d+)?)?)?(Z|[-+]\d{2}:\d{2})?$/i;
    TomlDate = class _TomlDate extends Date {
      #hasDate = false;
      #hasTime = false;
      #offset = null;
      constructor(date) {
        let hasDate = true;
        let hasTime = true;
        let offset = "Z";
        if (typeof date === "string") {
          let match = date.match(DATE_TIME_RE);
          if (match) {
            if (!match[1]) {
              hasDate = false;
              date = `0000-01-01T${date}`;
            }
            hasTime = !!match[2];
            hasTime && date[10] === " " && (date = date.replace(" ", "T"));
            if (match[2] && +match[2] > 23) {
              date = "";
            } else {
              offset = match[3] || null;
              date = date.toUpperCase();
              if (!offset && hasTime)
                date += "Z";
            }
          } else {
            date = "";
          }
        }
        super(date);
        if (!isNaN(this.getTime())) {
          this.#hasDate = hasDate;
          this.#hasTime = hasTime;
          this.#offset = offset;
        }
      }
      isDateTime() {
        return this.#hasDate && this.#hasTime;
      }
      isLocal() {
        return !this.#hasDate || !this.#hasTime || !this.#offset;
      }
      isDate() {
        return this.#hasDate && !this.#hasTime;
      }
      isTime() {
        return this.#hasTime && !this.#hasDate;
      }
      isValid() {
        return this.#hasDate || this.#hasTime;
      }
      toISOString() {
        let iso = super.toISOString();
        if (this.isDate())
          return iso.slice(0, 10);
        if (this.isTime())
          return iso.slice(11, 23);
        if (this.#offset === null)
          return iso.slice(0, -1);
        if (this.#offset === "Z")
          return iso;
        let offset = +this.#offset.slice(1, 3) * 60 + +this.#offset.slice(4, 6);
        offset = this.#offset[0] === "-" ? offset : -offset;
        let offsetDate = new Date(this.getTime() - offset * 6e4);
        return offsetDate.toISOString().slice(0, -1) + this.#offset;
      }
      static wrapAsOffsetDateTime(jsDate, offset = "Z") {
        let date = new _TomlDate(jsDate);
        date.#offset = offset;
        return date;
      }
      static wrapAsLocalDateTime(jsDate) {
        let date = new _TomlDate(jsDate);
        date.#offset = null;
        return date;
      }
      static wrapAsLocalDate(jsDate) {
        let date = new _TomlDate(jsDate);
        date.#hasTime = false;
        date.#offset = null;
        return date;
      }
      static wrapAsLocalTime(jsDate) {
        let date = new _TomlDate(jsDate);
        date.#hasDate = false;
        date.#offset = null;
        return date;
      }
    };
  }
});

// node_modules/smol-toml/dist/error.js
function getLineColFromPtr(string, ptr) {
  let lines = string.slice(0, ptr).split(/\r\n|\n|\r/g);
  return [lines.length, lines.pop().length + 1];
}
function makeCodeBlock(string, line, column) {
  let lines = string.split(/\r\n|\n|\r/g);
  let codeblock = "";
  let numberLen = (Math.log10(line + 1) | 0) + 1;
  for (let i2 = line - 1; i2 <= line + 1; i2++) {
    let l2 = lines[i2 - 1];
    if (!l2)
      continue;
    codeblock += i2.toString().padEnd(numberLen, " ");
    codeblock += ":  ";
    codeblock += l2;
    codeblock += "\n";
    if (i2 === line) {
      codeblock += " ".repeat(numberLen + column + 2);
      codeblock += "^\n";
    }
  }
  return codeblock;
}
var TomlError;
var init_error = __esm({
  "node_modules/smol-toml/dist/error.js"() {
    TomlError = class extends Error {
      line;
      column;
      codeblock;
      constructor(message, options) {
        const [line, column] = getLineColFromPtr(options.toml, options.ptr);
        const codeblock = makeCodeBlock(options.toml, line, column);
        super(`Invalid TOML document: ${message}

${codeblock}`, options);
        this.line = line;
        this.column = column;
        this.codeblock = codeblock;
      }
    };
  }
});

// node_modules/smol-toml/dist/util.js
function indexOfNewline(str, start = 0) {
  let idx = str.indexOf("\n", start);
  if (str.charCodeAt(idx - 1) === 13)
    idx--;
  return idx;
}
function skipComment(ctx2) {
  for (; ctx2.p < ctx2.s.length; ctx2.p++) {
    let c2 = ctx2.s.charCodeAt(ctx2.p);
    if (c2 === 10)
      break;
    if (c2 === 13 && ctx2.s.charCodeAt(ctx2.p + 1) === 10) {
      ctx2.p++;
      break;
    }
    if (c2 < 32 && c2 !== 9 || c2 === 127) {
      throw new TomlError("control characters are not allowed in comments", {
        toml: ctx2.s,
        ptr: ctx2.p
      });
    }
  }
}
function skipVoid(ctx2, banNewLines, banComments) {
  let c2;
  while (1) {
    while ((c2 = ctx2.s.charCodeAt(ctx2.p)) === 32 || c2 === 9 || !banNewLines && (c2 === 10 || c2 === 13 && ctx2.s.charCodeAt(ctx2.p + 1) === 10))
      ctx2.p++;
    if (banComments || c2 !== 35)
      break;
    skipComment(ctx2);
  }
}
function skipUntil(ctx2, sep, end) {
  let ptr = ctx2.p;
  if (!end) {
    ptr = indexOfNewline(ctx2.s, ptr);
    ctx2.p = ptr < 0 ? ctx2.s.length : ptr;
    return;
  }
  for (; ctx2.p < ctx2.s.length; ctx2.p++) {
    let c2 = ctx2.s.charCodeAt(ctx2.p);
    if (c2 === 35) {
      skipComment(ctx2);
    } else if (c2 === end || c2 === sep) {
      return;
    }
  }
  throw new TomlError("cannot find end of structure", {
    toml: ctx2.s,
    ptr
  });
}
var init_util = __esm({
  "node_modules/smol-toml/dist/util.js"() {
    init_error();
  }
});

// node_modules/smol-toml/dist/primitive.js
function parseString(ctx2) {
  let start = ctx2.p;
  let c2 = ctx2.s.charCodeAt(ctx2.p++);
  let first = c2;
  let isLiteral = c2 === 39;
  let isMultiline = c2 === ctx2.s.charCodeAt(ctx2.p) && c2 === ctx2.s.charCodeAt(ctx2.p + 1);
  if (isMultiline) {
    if ((c2 = ctx2.s.charCodeAt(ctx2.p += 2)) === 10)
      ctx2.p++;
    else if (c2 === 13 && ctx2.s.charCodeAt(ctx2.p + 1) === 10)
      ctx2.p += 2;
  }
  let parsed = "";
  let sliceStart = ctx2.p;
  let state = 0;
  for (; ctx2.p < ctx2.s.length; ctx2.p++) {
    c2 = ctx2.s.charCodeAt(ctx2.p);
    if (isMultiline && (c2 === 10 || c2 === 13 && ctx2.s.charCodeAt(ctx2.p + 1) === 10)) {
      state = state && 3;
    } else if (c2 < 32 && c2 !== 9 || c2 === 127) {
      throw new TomlError("control characters are not allowed in strings", {
        toml: ctx2.s,
        ptr: ctx2.p
      });
    } else if ((!state || state === 3) && c2 === first && (!isMultiline || ctx2.s.charCodeAt(ctx2.p + 1) === first && ctx2.s.charCodeAt(ctx2.p + 2) === first)) {
      if (isMultiline) {
        if (ctx2.s.charCodeAt(ctx2.p + 3) === first)
          ctx2.p++;
        if (ctx2.s.charCodeAt(ctx2.p + 3) === first)
          ctx2.p++;
      }
      if (!state)
        parsed += ctx2.s.slice(sliceStart, ctx2.p);
      ctx2.p += isMultiline ? 3 : 1;
      return parsed;
    } else if (!state) {
      if (!isLiteral && c2 === 92) {
        parsed += ctx2.s.slice(sliceStart, sliceStart = ctx2.p);
        state = 1;
      }
    } else if (state === 1) {
      if (c2 === 120 || c2 === 117 || c2 === 85) {
        let value = 0;
        let len = c2 === 120 ? 2 : c2 === 117 ? 4 : 8;
        for (let j = 0; j < len; j++, ctx2.p++) {
          let hex = ctx2.s.charCodeAt(ctx2.p + 1);
          let digit = (
            /* 0-9 */
            hex >= 48 && hex <= 57 ? hex - 48 : (
              /* A-F */
              hex >= 65 && hex <= 70 ? hex - 65 + 10 : (
                /* a-f */
                hex >= 97 && hex <= 102 ? hex - 97 + 10 : -1
              )
            )
          );
          if (digit < 0)
            throw new TomlError("invalid non-hex character in unicode escape", { toml: ctx2.s, ptr: ctx2.p + 1 });
          value = value << 4 | digit;
        }
        if (value < 0 || value > 1114111 || value >= 55296 && value <= 57343) {
          throw new TomlError("invalid unicode escape", { toml: ctx2.s, ptr: ctx2.p });
        }
        parsed += String.fromCodePoint(value);
        sliceStart = ctx2.p + 1;
        state = 0;
      } else if (c2 === 32 || c2 === 9) {
        state = 2;
      } else {
        if (c2 === 98)
          parsed += "\b";
        else if (c2 === 116)
          parsed += "	";
        else if (c2 === 110)
          parsed += "\n";
        else if (c2 === 102)
          parsed += "\f";
        else if (c2 === 114)
          parsed += "\r";
        else if (c2 === 101)
          parsed += "\x1B";
        else if (c2 === 34)
          parsed += '"';
        else if (c2 === 92)
          parsed += "\\";
        else
          throw new TomlError("unrecognized escape sequence", { toml: ctx2.s, ptr: ctx2.p });
        sliceStart = ctx2.p + 1;
        state = 0;
      }
    } else if (c2 !== 32 && c2 !== 9) {
      if (state === 2) {
        throw new TomlError("invalid escape: only line-ending whitespace may be escaped", {
          toml: ctx2.s,
          ptr: sliceStart
        });
      }
      state = !isLiteral && c2 === 92 ? 1 : 0;
      sliceStart = ctx2.p;
    }
  }
  throw new TomlError("unfinished string", { toml: ctx2.s, ptr: start });
}
function sliceAndTrimEndOf(ctx2, start, end) {
  let value = ctx2.s.slice(start, end);
  let commentIdx = value.indexOf("#");
  if (commentIdx > 0) {
    skipComment({ s: value, p: commentIdx, d: 0 });
    value = value.slice(0, commentIdx);
  }
  return value.trimEnd();
}
function parseValue(ctx2, integersAsBigInt, end) {
  let ptr = ctx2.p;
  let err = { toml: ctx2.s, ptr };
  skipUntil(ctx2, 44, end);
  let value = sliceAndTrimEndOf(ctx2, ptr, ctx2.p);
  if (!value)
    throw new TomlError("incomplete declaration: value expected", err);
  if (value === "-inf")
    return -Infinity;
  if (value === "inf" || value === "+inf")
    return Infinity;
  if (value === "nan" || value === "+nan" || value === "-nan")
    return NaN;
  if (value === "-0")
    return integersAsBigInt ? 0n : 0;
  let isInt = INT_REGEX.test(value);
  if (isInt || FLOAT_REGEX.test(value)) {
    if (LEADING_ZERO.test(value)) {
      throw new TomlError("leading zeroes are not allowed", err);
    }
    value = value.replace(/_/g, "");
    let numeric = +value;
    if (isNaN(numeric)) {
      throw new TomlError("invalid number", err);
    }
    if (isInt) {
      if ((isInt = !Number.isSafeInteger(numeric)) && !integersAsBigInt) {
        throw new TomlError("integer value cannot be represented losslessly", err);
      }
      if (isInt || integersAsBigInt === true)
        numeric = BigInt(value);
    }
    return numeric;
  }
  const date = new TomlDate(value);
  if (!date.isValid())
    throw new TomlError("invalid value", err);
  return date;
}
var INT_REGEX, FLOAT_REGEX, LEADING_ZERO;
var init_primitive = __esm({
  "node_modules/smol-toml/dist/primitive.js"() {
    init_date();
    init_error();
    init_util();
    INT_REGEX = /^((0x[0-9a-fA-F](_?[0-9a-fA-F])*)|(([+-]|0[ob])?\d(_?\d)*))$/;
    FLOAT_REGEX = /^[+-]?\d(_?\d)*(\.\d(_?\d)*)?([eE][+-]?\d(_?\d)*)?$/;
    LEADING_ZERO = /^[+-]?0[0-9_]/;
  }
});

// node_modules/smol-toml/dist/extract.js
function extractValue(ctx2, end, integersAsBigInt) {
  let ptr = ctx2.p;
  let c2 = ctx2.s.charCodeAt(ptr);
  if (c2 === 91 || c2 === 123) {
    if (!ctx2.d--) {
      throw new TomlError("document contains excessively nested structures. aborting.", {
        toml: ctx2.s,
        ptr
      });
    }
    let value = c2 === 91 ? parseArray(ctx2, integersAsBigInt) : parseInlineTable(ctx2, integersAsBigInt);
    ctx2.d++;
    return value;
  }
  if (c2 === 34 || c2 === 39) {
    return parseString(ctx2);
  }
  if (c2 === 116) {
    if (ctx2.s.charCodeAt(++ctx2.p) !== 114 || ctx2.s.charCodeAt(++ctx2.p) !== 117 || ctx2.s.charCodeAt(++ctx2.p) !== 101)
      throw new TomlError("invalid value", { toml: ctx2.s, ptr });
    ctx2.p++;
    return true;
  }
  if (c2 === 102) {
    if (ctx2.s.charCodeAt(++ctx2.p) !== 97 || ctx2.s.charCodeAt(++ctx2.p) !== 108 || ctx2.s.charCodeAt(++ctx2.p) !== 115 || ctx2.s.charCodeAt(++ctx2.p) !== 101)
      throw new TomlError("invalid value", { toml: ctx2.s, ptr });
    ctx2.p++;
    return false;
  }
  return parseValue(ctx2, integersAsBigInt, end);
}
var init_extract = __esm({
  "node_modules/smol-toml/dist/extract.js"() {
    init_primitive();
    init_struct();
    init_error();
  }
});

// node_modules/smol-toml/dist/struct.js
function parseKey(ctx2, end = "=") {
  let start = ctx2.p;
  let dot = start - 1;
  let parsed = [];
  let endPtr = ctx2.s.indexOf(end, start);
  if (endPtr < 0) {
    throw new TomlError("incomplete key-value: cannot find end of key", {
      toml: ctx2.s,
      ptr: start
    });
  }
  do {
    let c2 = ctx2.s.charCodeAt(ctx2.p = ++dot);
    if (c2 !== 32 && c2 !== 9) {
      if (c2 === 34 || c2 === 39) {
        if (c2 === ctx2.s.charCodeAt(ctx2.p + 1) && c2 === ctx2.s.charCodeAt(ctx2.p + 2)) {
          throw new TomlError("multiline strings are not allowed in keys", {
            toml: ctx2.s,
            ptr: ctx2.p
          });
        }
        let part = parseString(ctx2);
        dot = ctx2.s.indexOf(".", ctx2.p);
        let strEnd = ctx2.s.slice(ctx2.p, dot < 0 || dot > endPtr ? endPtr : dot);
        let newLine = indexOfNewline(strEnd);
        if (newLine > -1) {
          throw new TomlError("newlines are not allowed in keys", {
            toml: ctx2.s,
            ptr: newLine
          });
        }
        if (strEnd.trimStart()) {
          throw new TomlError("found extra tokens after the string part", {
            toml: ctx2.s,
            ptr: ctx2.p
          });
        }
        if (endPtr < ctx2.p) {
          endPtr = ctx2.s.indexOf(end, ctx2.p);
          if (endPtr < 0) {
            throw new TomlError("incomplete key-value: cannot find end of key", {
              toml: ctx2.s,
              ptr: start
            });
          }
        }
        parsed.push(part);
      } else {
        dot = ctx2.s.indexOf(".", ctx2.p);
        let part = ctx2.s.slice(ctx2.p, dot < 0 || dot > endPtr ? endPtr : dot);
        if (!KEY_PART_RE.test(part)) {
          throw new TomlError("only letter, numbers, dashes and underscores are allowed in keys", {
            toml: ctx2.s,
            ptr: ctx2.p
          });
        }
        parsed.push(part.trimEnd());
      }
    }
  } while (dot + 1 && dot < endPtr);
  ctx2.p = endPtr + 1;
  skipVoid(ctx2, true, true);
  return parsed;
}
function parseInlineTable(ctx2, integersAsBigInt) {
  let res = {};
  let seen = /* @__PURE__ */ new Set();
  let c2;
  ctx2.p++;
  while (ctx2.p < ctx2.s.length) {
    skipVoid(ctx2);
    if ((c2 = ctx2.s.charCodeAt(ctx2.p)) === 125) {
      ctx2.p++;
      return res;
    }
    let k;
    let t2 = res;
    let hasOwn = false;
    let p = ctx2.p;
    let key = parseKey(ctx2);
    for (let i2 = 0; i2 < key.length; i2++) {
      if (i2)
        t2 = hasOwn ? t2[k] : t2[k] = {};
      k = key[i2];
      if ((hasOwn = Object.hasOwn(t2, k)) && (typeof t2[k] !== "object" || seen.has(t2[k]))) {
        throw new TomlError("trying to redefine an already defined value", {
          toml: ctx2.s,
          ptr: p
        });
      }
      if (!hasOwn && k === "__proto__") {
        Object.defineProperty(t2, k, { enumerable: true, configurable: true, writable: true });
      }
    }
    if (hasOwn) {
      throw new TomlError("trying to redefine an already defined value", {
        toml: ctx2.s,
        ptr: ctx2.p
      });
    }
    let value = extractValue(ctx2, 125, integersAsBigInt);
    seen.add(t2[k] = value);
    skipVoid(ctx2);
    if ((c2 = ctx2.s.charCodeAt(ctx2.p++)) === 125) {
      return res;
    }
    if (c2 !== 44) {
      throw new TomlError("expected comma or end of structure", { toml: ctx2.s, ptr: ctx2.p - 1 });
    }
  }
  throw new TomlError("unfinished table encountered", {
    toml: ctx2.s,
    ptr: ctx2.p
  });
}
function parseArray(ctx2, integersAsBigInt) {
  let res = [];
  let c2;
  ctx2.p++;
  while (ctx2.p < ctx2.s.length) {
    skipVoid(ctx2);
    if ((c2 = ctx2.s.charCodeAt(ctx2.p)) === 93) {
      ctx2.p++;
      return res;
    }
    res.push(extractValue(ctx2, 93, integersAsBigInt));
    skipVoid(ctx2);
    if ((c2 = ctx2.s.charCodeAt(ctx2.p++)) === 93) {
      return res;
    }
    if (c2 !== 44) {
      throw new TomlError("expected comma or end of structure", { toml: ctx2.s, ptr: ctx2.p - 1 });
    }
  }
  throw new TomlError("unfinished array encountered", {
    toml: ctx2.s,
    ptr: ctx2.p
  });
}
var KEY_PART_RE;
var init_struct = __esm({
  "node_modules/smol-toml/dist/struct.js"() {
    init_primitive();
    init_extract();
    init_util();
    init_error();
    KEY_PART_RE = /^[a-zA-Z0-9-_]+[ \t]*$/;
  }
});

// node_modules/smol-toml/dist/parse.js
function peekTable(key, table2, meta, type) {
  let t2 = table2;
  let m = meta;
  let k;
  let hasOwn = false;
  let state;
  for (let i2 = 0; i2 < key.length; i2++) {
    if (i2) {
      t2 = hasOwn ? t2[k] : t2[k] = {};
      m = (state = m[k]).c;
      if (type === 0 && (state.t === 1 || state.t === 2)) {
        return null;
      }
      if (state.t === 2) {
        let l2 = t2.length - 1;
        t2 = t2[l2];
        m = m[l2].c;
      }
    }
    k = key[i2];
    if ((hasOwn = Object.hasOwn(t2, k)) && m[k]?.t === 0 && m[k]?.d) {
      return null;
    }
    if (!hasOwn) {
      if (k === "__proto__") {
        Object.defineProperty(t2, k, { enumerable: true, configurable: true, writable: true });
        Object.defineProperty(m, k, { enumerable: true, configurable: true, writable: true });
      }
      m[k] = {
        t: i2 < key.length - 1 && type === 2 ? 3 : type,
        d: false,
        i: 0,
        c: {}
      };
    }
  }
  state = m[k];
  if (state.t !== type && !(type === 1 && state.t === 3)) {
    return null;
  }
  if (type === 2) {
    if (!state.d) {
      state.d = true;
      t2[k] = [];
    }
    t2[k].push(t2 = {});
    state.c[state.i++] = state = { t: 1, d: false, i: 0, c: {} };
  }
  if (state.d) {
    return null;
  }
  state.d = true;
  if (type === 1) {
    t2 = hasOwn ? t2[k] : t2[k] = {};
  } else if (type === 0 && hasOwn) {
    return null;
  }
  return [k, t2, state.c];
}
function parse(toml, { maxDepth = 1e3, integersAsBigInt } = {}) {
  let ctx2 = { s: toml, p: 0, d: maxDepth };
  let res = {};
  let meta = {};
  let tmp;
  let tbl = res;
  let m = meta;
  skipVoid(ctx2);
  while (ctx2.p < toml.length) {
    if (toml.charCodeAt(ctx2.p) === 91) {
      let isTableArray = toml.charCodeAt(++ctx2.p) === 91;
      tmp = ctx2.p += +isTableArray;
      let k = parseKey(ctx2, "]");
      if (isTableArray) {
        if (toml.charCodeAt(ctx2.p - 1) !== 93) {
          throw new TomlError("expected end of table declaration", {
            toml,
            ptr: ctx2.p - 1
          });
        }
        ctx2.p++;
      }
      let p = peekTable(
        k,
        res,
        meta,
        isTableArray ? 2 : 1
        /* Type.EXPLICIT */
      );
      if (!p) {
        throw new TomlError("trying to redefine an already defined table or value", {
          toml,
          ptr: tmp
        });
      }
      m = p[2];
      tbl = p[1];
    } else {
      tmp = ctx2.p;
      let k = parseKey(ctx2);
      let p = peekTable(
        k,
        tbl,
        m,
        0
        /* Type.DOTTED */
      );
      if (!p) {
        throw new TomlError("trying to redefine an already defined table or value", {
          toml,
          ptr: tmp
        });
      }
      p[1][p[0]] = extractValue(ctx2, void 0, integersAsBigInt);
    }
    skipVoid(ctx2, true);
    if (ctx2.p < toml.length && (tmp = toml.charCodeAt(ctx2.p)) !== 10 && tmp !== 13) {
      throw new TomlError("each key-value declaration must be followed by an end-of-line", {
        toml,
        ptr: ctx2.p
      });
    }
    skipVoid(ctx2);
  }
  return res;
}
var init_parse = __esm({
  "node_modules/smol-toml/dist/parse.js"() {
    init_struct();
    init_extract();
    init_util();
    init_error();
  }
});

// node_modules/smol-toml/dist/stringify.js
function extendedTypeOf(obj) {
  let type = typeof obj;
  if (type === "object") {
    if (Array.isArray(obj))
      return "array";
    if (typeof obj?.getUTCDate === "function" && obj instanceof Date)
      return "date";
    if (globalThis.Temporal && // check for the 'since' property as an early bailout that avoids running all 5 instanceof checks
    typeof obj?.since === "function" && (obj instanceof Temporal.Instant || obj instanceof Temporal.PlainDate || obj instanceof Temporal.PlainDateTime || obj instanceof Temporal.PlainTime || obj instanceof Temporal.ZonedDateTime)) {
      return "temporal";
    }
  }
  return type;
}
function isArrayOfTables(obj) {
  for (let i2 = 0; i2 < obj.length; i2++) {
    if (extendedTypeOf(obj[i2]) !== "object")
      return false;
  }
  return obj.length != 0;
}
function formatString(s) {
  return JSON.stringify(s).replace(/\x7f/g, "\\u007f");
}
function stringifyTemporal(temporal) {
  return temporal.toString({
    calendarName: "never",
    timeZoneName: "never"
  });
}
function stringifyValue(val, type, depth, numberAsFloat) {
  if (depth === 0) {
    throw new Error("Could not stringify the object: maximum object depth exceeded");
  }
  switch (type) {
    // @ts-expect-error -- intentional fallthrough case
    case "number":
      if (isNaN(val))
        return "nan";
      if (val === Infinity)
        return "inf";
      if (val === -Infinity)
        return "-inf";
      if (Number.isInteger(val) && (numberAsFloat || !Number.isSafeInteger(val)))
        return val.toFixed(1);
    case "bigint":
    case "boolean":
      return val.toString();
    case "string":
      return formatString(val);
    case "date":
      if (isNaN(val.getTime()))
        throw new TypeError("cannot serialize invalid date");
      return val.toISOString();
    case "object":
      return stringifyInlineTable(val, depth, numberAsFloat);
    case "array":
      return stringifyArray(val, depth, numberAsFloat);
    case "temporal":
      return stringifyTemporal(val);
  }
}
function stringifyInlineTable(obj, depth, numberAsFloat) {
  let keys = Object.keys(obj);
  if (keys.length === 0)
    return "{}";
  let res = "{ ";
  for (let i2 = 0; i2 < keys.length; i2++) {
    let k = keys[i2];
    if (i2)
      res += ", ";
    res += BARE_KEY.test(k) ? k : formatString(k);
    res += " = ";
    res += stringifyValue(obj[k], extendedTypeOf(obj[k]), depth - 1, numberAsFloat);
  }
  return res + " }";
}
function stringifyArray(array, depth, numberAsFloat) {
  if (array.length === 0)
    return "[]";
  let res = "[ ";
  for (let i2 = 0; i2 < array.length; i2++) {
    if (i2)
      res += ", ";
    if (array[i2] === null || array[i2] === void 0) {
      throw new TypeError("arrays cannot contain null or undefined values");
    }
    res += stringifyValue(array[i2], extendedTypeOf(array[i2]), depth - 1, numberAsFloat);
  }
  return res + " ]";
}
function stringifyArrayTable(array, key, depth, numberAsFloat) {
  if (depth === 0) {
    throw new Error("Could not stringify the object: maximum object depth exceeded");
  }
  let res = "";
  for (let i2 = 0; i2 < array.length; i2++) {
    res += `${res && "\n"}[[${key}]]
`;
    res += stringifyTable(0, array[i2], key, depth, numberAsFloat);
  }
  return res;
}
function stringifyTable(tableKey, obj, prefix, depth, numberAsFloat) {
  if (depth === 0) {
    throw new Error("Could not stringify the object: maximum object depth exceeded");
  }
  let preamble = "";
  let tables = "";
  let keys = Object.keys(obj);
  for (let i2 = 0; i2 < keys.length; i2++) {
    let k = keys[i2];
    if (obj[k] !== null && obj[k] !== void 0) {
      let type = extendedTypeOf(obj[k]);
      if (type === "symbol" || type === "function") {
        throw new TypeError(`cannot serialize values of type '${type}'`);
      }
      let key = BARE_KEY.test(k) ? k : formatString(k);
      if (type === "array" && isArrayOfTables(obj[k])) {
        tables += (tables && "\n") + stringifyArrayTable(obj[k], prefix ? `${prefix}.${key}` : key, depth - 1, numberAsFloat);
      } else if (type === "object") {
        let tblKey = prefix ? `${prefix}.${key}` : key;
        tables += (tables && "\n") + stringifyTable(tblKey, obj[k], tblKey, depth - 1, numberAsFloat);
      } else {
        preamble += key;
        preamble += " = ";
        preamble += stringifyValue(obj[k], type, depth, numberAsFloat);
        preamble += "\n";
      }
    }
  }
  if (tableKey && (preamble || !tables))
    preamble = preamble ? `[${tableKey}]
${preamble}` : `[${tableKey}]`;
  return preamble && tables ? `${preamble}
${tables}` : preamble || tables;
}
function stringify(obj, { maxDepth = 1e3, numbersAsFloat = false } = {}) {
  if (extendedTypeOf(obj) !== "object") {
    throw new TypeError("stringify can only be called with an object");
  }
  let str = stringifyTable(0, obj, "", maxDepth, numbersAsFloat);
  if (str[str.length - 1] !== "\n")
    return str + "\n";
  return str;
}
var BARE_KEY;
var init_stringify = __esm({
  "node_modules/smol-toml/dist/stringify.js"() {
    BARE_KEY = /^[a-z0-9-_]+$/i;
  }
});

// node_modules/smol-toml/dist/index.js
var init_dist5 = __esm({
  "node_modules/smol-toml/dist/index.js"() {
    init_parse();
    init_stringify();
    init_date();
    init_error();
  }
});

// src/config.ts
var config_exports = {};
__export(config_exports, {
  loadMachine: () => loadMachine,
  machineExists: () => machineExists,
  repoDir: () => repoDir,
  saveMachine: () => saveMachine
});
import { existsSync, mkdirSync, readFileSync as readFileSync2, writeFileSync } from "node:fs";
import { dirname } from "node:path";
function machineExists() {
  return existsSync(machineFile());
}
function loadMachine() {
  if (!machineExists()) throw new Error("cs: no machine config yet \u2014 run `cs init` first");
  const d = parse(readFileSync2(machineFile(), "utf8"));
  return {
    name: d.name,
    profiles: d.profiles ?? ["personal"],
    exclude: d.exclude ?? [],
    workspace: d.workspace,
    repo: d.repo,
    secretsBackend: d.secrets?.backend ?? "sops"
  };
}
function saveMachine(m) {
  const obj = { name: m.name, profiles: m.profiles, exclude: m.exclude };
  if (m.workspace) obj.workspace = m.workspace;
  if (m.repo) obj.repo = m.repo;
  obj.secrets = { backend: m.secretsBackend };
  mkdirSync(dirname(machineFile()), { recursive: true });
  writeFileSync(machineFile(), "# claude-share machine config (not synced). Edit freely.\n" + stringify(obj) + "\n");
}
var repoDir;
var init_config = __esm({
  "src/config.ts"() {
    "use strict";
    init_dist5();
    init_paths();
    repoDir = (m) => m.repo ? expand(m.repo) : repoDirDefault();
  }
});

// src/manifest.ts
var manifest_exports = {};
__export(manifest_exports, {
  KINDS: () => KINDS,
  NAME_RE: () => NAME_RE,
  SUPPORTED_SCHEMA: () => SUPPORTED_SCHEMA,
  appendIdentity: () => appendIdentity,
  appendProject: () => appendProject,
  checkoutRoot: () => checkoutRoot,
  container: () => container,
  globMatch: () => globMatch,
  globs: () => globs,
  identityBlock: () => identityBlock,
  identityByFlag: () => identityByFlag,
  identityForUrl: () => identityForUrl,
  identityMatches: () => identityMatches,
  keyPath: () => keyPath,
  loadManifest: () => loadManifest,
  parseManifest: () => parseManifest,
  projectBlock: () => projectBlock,
  projectForPath: () => projectForPath,
  selected: () => selected,
  selectedProjects: () => selectedProjects,
  validate: () => validate,
  workspace: () => workspace
});
import { existsSync as existsSync2, readFileSync as readFileSync3, writeFileSync as writeFileSync2 } from "node:fs";
import { join as join3, isAbsolute as isAbsolute2, resolve as resolve2 } from "node:path";
function globMatch(pattern, s) {
  const re = "^" + pattern.split("**").map((part) => part.split("*").map((x) => x.replace(/[.+^${}()|[\]\\?]/g, "\\$&")).join("[^/]*")).join(".*") + "$";
  return new RegExp(re).test(s);
}
function identityForUrl(m, url) {
  return Object.values(m.identities).find((i2) => identityMatches(i2, url));
}
function identityByFlag(m, flag) {
  const f = flag.toLowerCase();
  return Object.values(m.identities).find((i2) => i2.id.toLowerCase() === f || i2.owner?.toLowerCase() === f);
}
function selected(p, m) {
  if (p.machines.length && !p.machines.includes(m.name)) return false;
  if (m.exclude.includes(p.name)) return false;
  return p.profiles.includes("all") || p.profiles.some((x) => m.profiles.includes(x));
}
function projectForPath(man, m, path) {
  const ws = resolve2(workspace(man, m));
  const r2 = resolve2(path);
  if (!(r2 === ws || r2.startsWith(ws + "/"))) return void 0;
  const first = r2.slice(ws.length + 1).split("/")[0];
  return first ? Object.values(man.projects).find((p) => (p.path || p.name) === first) : void 0;
}
function parseManifest(text3, path) {
  const d = parse(text3);
  const identities = {};
  for (const [id, v] of Object.entries(d.identities ?? {}))
    identities[id] = { id, name: v.name ?? "", email: v.email ?? "", owner: v.owner ?? v.github_owner ?? "", sshKey: v.ssh_key, urlGlobs: v.url_globs };
  const projects = {};
  for (const [name2, v] of Object.entries(d.projects ?? {}))
    projects[name2] = {
      name: name2,
      kind: v.kind ?? "git",
      path: v.path,
      url: v.url,
      identity: v.identity,
      profiles: v.profiles ?? ["all"],
      machines: v.machines ?? [],
      branch: v.branch,
      layout: v.layout ?? "plain",
      postClone: v.post_clone,
      description: v.description,
      handoff: v.handoff ?? {},
      sync: v.sync ?? {}
    };
  return { workspaceRoot: d.workspace?.root ?? "~/dev", defaultBranch: d.workspace?.default_branch ?? "master", identities, projects, schemaVersion: d.schema_version ?? 1, path };
}
function validate(m) {
  const errs = [];
  if (m.schemaVersion > SUPPORTED_SCHEMA) errs.push(`projects.toml schema_version ${m.schemaVersion} > supported ${SUPPORTED_SCHEMA}; run cs self-update`);
  for (const i2 of Object.values(m.identities)) if (!i2.owner && !i2.urlGlobs?.length) errs.push(`identity ${i2.id}: needs owner (GitHub user/org)`);
  for (const p of Object.values(m.projects)) {
    if (!NAME_RE.test(p.name)) errs.push(`${p.name}: invalid project name`);
    if (!KINDS.includes(p.kind)) errs.push(`${p.name}: kind must be one of ${KINDS.join("|")}`);
    if (p.kind === "git") {
      if (!p.url) errs.push(`${p.name}: kind=git requires url`);
      if (!p.identity) errs.push(`${p.name}: kind=git requires identity`);
      else if (!m.identities[p.identity]) errs.push(`${p.name}: unknown identity '${p.identity}'`);
      else if (p.url && !identityMatches(m.identities[p.identity], p.url)) errs.push(`${p.name}: url ${p.url} does not match identity '${p.identity}'`);
    }
    if (p.path && (isAbsolute2(p.path) || p.path.split("/").includes(".."))) errs.push(`${p.name}: path must be relative and inside the workspace`);
  }
  return errs;
}
function loadManifest(repo) {
  const f = join3(repo, "projects.toml");
  if (!existsSync2(f)) throw new Error(`cs: no projects.toml in ${repo}`);
  const m = parseManifest(readFileSync3(f, "utf8"), f);
  const errs = validate(m);
  if (errs.length) throw new Error("cs: projects.toml invalid:\n  " + errs.join("\n  "));
  return m;
}
function block2(header, values) {
  const clean = {};
  for (const [k, v] of Object.entries(values)) if (v !== void 0 && v !== "" && !(Array.isArray(v) && !v.length)) clean[k] = v;
  return `[${header}]
` + stringify(clean).trimEnd() + "\n";
}
function projectBlock(p) {
  return block2(`projects.${p.name}`, {
    kind: p.kind,
    path: p.path && p.path !== p.name ? p.path : void 0,
    url: p.kind === "git" ? p.url : void 0,
    identity: p.kind === "git" ? p.identity : void 0,
    branch: p.kind === "git" ? p.branch : void 0,
    profiles: p.profiles,
    machines: p.machines,
    layout: p.layout !== "plain" ? p.layout : void 0,
    post_clone: p.postClone,
    description: p.description
  });
}
function identityBlock(i2) {
  return block2(`identities.${i2.id}`, {
    owner: i2.owner,
    name: i2.name,
    email: i2.email,
    ssh_key: i2.sshKey && i2.sshKey !== `~/.ssh/cs/${i2.id}` ? i2.sshKey : void 0,
    url_globs: i2.urlGlobs && JSON.stringify(i2.urlGlobs) !== JSON.stringify([`git@github.com:${i2.owner}/**`]) ? i2.urlGlobs : void 0
  });
}
function appendProject(repo, p) {
  const f = join3(repo, "projects.toml");
  let t2 = readFileSync3(f, "utf8");
  if (new RegExp(`^\\[projects\\.${p.name.replace(/[.]/g, "\\.")}\\]\\s*$`, "m").test(t2)) throw new Error(`cs: project '${p.name}' already registered (edit projects.toml to change it)`);
  writeFileSync2(f, t2.replace(/\n*$/, "\n\n") + projectBlock(p));
}
function appendIdentity(repo, i2) {
  const f = join3(repo, "projects.toml");
  let t2 = readFileSync3(f, "utf8");
  if (new RegExp(`^\\[identities\\.${i2.id.replace(/[.]/g, "\\.")}\\]\\s*$`, "m").test(t2)) throw new Error(`cs: identity '${i2.id}' already exists`);
  const marker2 = "# ---- Projects";
  const b = identityBlock(i2);
  t2 = t2.includes(marker2) ? t2.slice(0, t2.indexOf(marker2)).replace(/\n*$/, "\n\n") + b + "\n" + t2.slice(t2.indexOf(marker2)) : t2.replace(/\n*$/, "\n\n") + b;
  writeFileSync2(f, t2);
}
var SUPPORTED_SCHEMA, NAME_RE, KINDS, keyPath, globs, identityMatches, workspace, container, checkoutRoot, selectedProjects;
var init_manifest = __esm({
  "src/manifest.ts"() {
    "use strict";
    init_dist5();
    init_paths();
    SUPPORTED_SCHEMA = 1;
    NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
    KINDS = ["git", "synced", "local"];
    keyPath = (i2) => i2.sshKey || `~/.ssh/cs/${i2.id}`;
    globs = (i2) => i2.urlGlobs?.length ? i2.urlGlobs : i2.owner ? [`git@github.com:${i2.owner}/**`] : [];
    identityMatches = (i2, url) => globs(i2).some((g) => globMatch(g, url));
    workspace = (man, m) => expand(m?.workspace || man.workspaceRoot);
    container = (p, ws) => join3(ws, p.path || p.name);
    checkoutRoot = (p, ws) => p.layout === "worktrees" ? join3(container(p, ws), "repo") : container(p, ws);
    selectedProjects = (man, m) => Object.values(man.projects).filter((p) => selected(p, m));
  }
});

// src/git.ts
import { spawnSync } from "node:child_process";
import { existsSync as existsSync3, statSync } from "node:fs";
import { join as join4, resolve as resolve3, isAbsolute as isAbsolute3 } from "node:path";
function git(args, cwd, opts = {}) {
  const env2 = { ...process.env };
  if (opts.sshKey) env2.GIT_SSH_COMMAND = `ssh -i ${opts.sshKey} -o IdentitiesOnly=yes`;
  const p = spawnSync("git", args, { cwd, env: env2, encoding: "utf8", timeout: opts.timeout ? opts.timeout * 1e3 : void 0, input: opts.input, stdio: ["pipe", "pipe", "pipe"] });
  const r2 = { code: p.status ?? 1, out: (p.stdout ?? "").trim(), err: (p.stderr ?? "").trim() };
  if (opts.check !== false && r2.code !== 0) {
    const last = r2.err.split("\n").filter(Boolean).pop() ?? "";
    throw new Error(`cs: git ${args.slice(0, 2).join(" ")} failed in ${cwd ?? "."}
  ${last}`);
  }
  return r2;
}
function version() {
  const v = out(["--version"]).split(" ").pop() ?? "0.0.0";
  const [a2, b, c2] = v.split(".").map((x) => parseInt(x, 10) || 0);
  return [a2, b, c2];
}
function aheadBehind(p) {
  const s = out(["rev-list", "--left-right", "--count", "@{upstream}...HEAD"], p);
  if (!s) return void 0;
  const [behind, ahead] = s.split(/\s+/).map((x) => parseInt(x, 10));
  return [ahead, behind];
}
function commonDir(p) {
  const c2 = out(["rev-parse", "--git-common-dir"], p);
  return isAbsolute3(c2) ? c2 : resolve3(p, c2);
}
function commit(p, message, fallbackName = "cs", fallbackEmail = "cs@localhost") {
  const pre = configGet(p, "user.email") ? [] : ["-c", `user.name=${fallbackName}`, "-c", `user.email=${fallbackEmail}`];
  git([...pre, "commit", "-q", "-m", message], p);
}
function canonicalGithub(url) {
  let u5 = url.trim();
  if (u5.startsWith("https://github.com/")) u5 = "git@github.com:" + u5.slice("https://github.com/".length);
  else if (u5.startsWith("ssh://git@github.com/")) u5 = "git@github.com:" + u5.slice("ssh://git@github.com/".length);
  else if (u5.startsWith("git@github-") && u5.includes(":")) u5 = "git@github.com:" + u5.split(":").slice(1).join(":");
  if (!u5.endsWith(".git")) u5 += ".git";
  return u5;
}
var out, isRepo, isBare, toplevel, remoteUrl, currentBranch, dirtyCount, isDirty, worktrees, infoExclude, configGet;
var init_git = __esm({
  "src/git.ts"() {
    "use strict";
    out = (args, cwd, dflt = "") => {
      const r2 = git(args, cwd, { check: false });
      return r2.code === 0 ? r2.out : dflt;
    };
    isRepo = (p) => existsSync3(join4(p, ".git"));
    isBare = (p) => existsSync3(join4(p, "HEAD")) && existsSync3(join4(p, "objects"));
    toplevel = (p) => out(["rev-parse", "--show-toplevel"], p) || void 0;
    remoteUrl = (p, name2 = "origin") => out(["remote", "get-url", name2], p);
    currentBranch = (p) => out(["symbolic-ref", "--short", "-q", "HEAD"], p);
    dirtyCount = (p) => {
      const s = out(["status", "--porcelain", "--untracked-files=normal"], p);
      return s ? s.split("\n").length : 0;
    };
    isDirty = (p) => dirtyCount(p) > 0;
    worktrees = (p) => out(["worktree", "list", "--porcelain"], p).split("\n").filter((l2) => l2.startsWith("worktree ")).map((l2) => l2.slice(9));
    infoExclude = (p) => join4(commonDir(p), "info", "exclude");
    configGet = (p, key) => out(["config", "--get", key], p);
  }
});

// src/github.ts
var github_exports = {};
__export(github_exports, {
  GitHubError: () => GitHubError,
  api: () => api,
  createRepo: () => createRepo,
  ensureRepo: () => ensureRepo,
  ensureToken: () => ensureToken,
  getToken: () => getToken,
  ownerType: () => ownerType,
  repoExists: () => repoExists,
  rmToken: () => rmToken,
  setToken: () => setToken,
  tokenFile: () => tokenFile,
  whoami: () => whoami
});
import { chmodSync, existsSync as existsSync4, mkdirSync as mkdirSync2, readFileSync as readFileSync4, unlinkSync, writeFileSync as writeFileSync3 } from "node:fs";
import { join as join5 } from "node:path";
function getToken(owner2) {
  const env2 = process.env[`CS_GITHUB_TOKEN_${owner2.toUpperCase().replace(/-/g, "_")}`];
  if (env2) return env2.trim();
  const f = tokenFile(owner2);
  return existsSync4(f) ? readFileSync4(f, "utf8").trim() || void 0 : void 0;
}
async function setToken(owner2, token2) {
  token2 ||= await password2(`GitHub fine-grained token for '${owner2}' (Administration r/w on all repos)`);
  if (!token2) throw new Error("cs: empty token");
  const f = tokenFile(owner2);
  mkdirSync2(join5(csConfigDir(), "tokens"), { recursive: true, mode: 448 });
  writeFileSync3(f, token2 + "\n");
  chmodSync(f, 384);
  return f;
}
function rmToken(owner2) {
  const f = tokenFile(owner2);
  if (existsSync4(f)) unlinkSync(f);
}
async function api(method, path, token2, body) {
  let r2;
  try {
    r2 = await fetch("https://api.github.com" + path, {
      method,
      headers: {
        Authorization: `Bearer ${token2}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "claude-share",
        ...body ? { "Content-Type": "application/json" } : {}
      },
      body: body ? JSON.stringify(body) : void 0,
      signal: AbortSignal.timeout(2e4)
    });
  } catch (e) {
    throw new GitHubError(`GitHub unreachable: ${e?.message ?? e}`);
  }
  const text3 = await r2.text();
  if (!r2.ok) {
    let msg = "";
    try {
      msg = JSON.parse(text3).message ?? "";
    } catch {
    }
    throw new GitHubError(`GitHub ${method} ${path}: ${r2.status} ${msg}`.trim());
  }
  return text3 ? JSON.parse(text3) : {};
}
async function repoExists(o, n3, t2) {
  try {
    await api("GET", `/repos/${o}/${n3}`, t2);
    return true;
  } catch (e) {
    if (String(e).includes(" 404")) return false;
    throw e;
  }
}
async function createRepo(o, n3, t2, priv = true, description = "") {
  const body = { name: n3, private: priv, description, auto_init: false };
  if (await ownerType(o, t2) === "Organization") return api("POST", `/orgs/${o}/repos`, t2, body);
  const me = await whoami(t2);
  if (me.toLowerCase() !== o.toLowerCase()) throw new GitHubError(`token belongs to '${me}', cannot create repos for user '${o}'`);
  return api("POST", "/user/repos", t2, body);
}
async function ensureToken(owner2, interactive = true) {
  const t2 = getToken(owner2);
  if (t2) return t2;
  if (!interactive) throw new GitHubError(`no GitHub token for '${owner2}' \u2014 run cs token set ${owner2}`);
  await setToken(owner2);
  const tok = getToken(owner2);
  const me = await whoami(tok);
  if (await ownerType(owner2, tok) === "User" && me.toLowerCase() !== owner2.toLowerCase()) throw new GitHubError(`token authenticates as '${me}', not '${owner2}'`);
  return tok;
}
async function ensureRepo(o, n3, t2, priv = true, description = "") {
  if (await repoExists(o, n3, t2)) return false;
  await createRepo(o, n3, t2, priv, description);
  return true;
}
var GitHubError, tokenFile, whoami, ownerType;
var init_github = __esm({
  "src/github.ts"() {
    "use strict";
    init_paths();
    init_ui();
    GitHubError = class extends Error {
    };
    tokenFile = (owner2) => join5(csConfigDir(), "tokens", owner2.toLowerCase());
    whoami = async (t2) => (await api("GET", "/user", t2)).login;
    ownerType = async (o, t2) => (await api("GET", `/users/${o}`, t2)).type;
  }
});

// src/master.ts
var master_exports = {};
__export(master_exports, {
  KEY: () => KEY,
  canAccess: () => canAccess,
  configureRepo: () => configureRepo,
  ensureKey: () => ensureKey,
  httpsUrl: () => httpsUrl,
  instructions: () => instructions,
  isPublic: () => isPublic,
  keyPath: () => keyPath2,
  parseRepoUrl: () => parseRepoUrl,
  registerDeployKey: () => registerDeployKey,
  setup: () => setup
});
import { chmodSync as chmodSync2, existsSync as existsSync5, mkdirSync as mkdirSync3, readFileSync as readFileSync5 } from "node:fs";
import { dirname as dirname2 } from "node:path";
import { spawnSync as spawnSync2 } from "node:child_process";
function ensureKey(machine = "") {
  const key = keyPath2(), pubf = key + ".pub";
  if (existsSync5(key) && existsSync5(pubf)) return { key, pub: readFileSync5(pubf, "utf8").trim(), created: false };
  mkdirSync3(dirname2(key), { recursive: true, mode: 448 });
  const p = spawnSync2("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-C", `cs:${machine || nodename()}:master`, "-f", key]);
  if (p.status !== 0) throw new Error("cs: ssh-keygen failed");
  chmodSync2(key, 384);
  return { key, pub: readFileSync5(pubf, "utf8").trim(), created: true };
}
function parseRepoUrl(text3) {
  const t2 = text3.trim().replace(/\/+$/, "");
  const m = t2.match(/^(?:https?:\/\/|ssh:\/\/git@|git@)?(?:www\.)?github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);
  return m ? [`git@github.com:${m[1]}/${m[2]}.git`, [m[1], m[2]]] : [t2, void 0];
}
function isPublic(url) {
  if (!url.startsWith("https://") || process.env.CS_OFFLINE) return void 0;
  const p = spawnSync2("git", ["ls-remote", "--exit-code", url, "HEAD"], { encoding: "utf8", env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }, timeout: 3e4, stdio: ["ignore", "pipe", "pipe"] });
  if (p.status === 0) return true;
  return /Authentication failed|could not read Username|Repository not found/.test(p.stderr ?? "") ? false : void 0;
}
function canAccess(sshUrl) {
  const p = spawnSync2("git", ["ls-remote", sshUrl, "HEAD"], {
    encoding: "utf8",
    timeout: 3e4,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, GIT_SSH_COMMAND: `ssh -i ${keyPath2()} -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=accept-new` }
  });
  return [p.status === 0, (p.stderr ?? "").trim().split("\n").pop() ?? ""];
}
async function registerDeployKey(owner2, repo, pub, title) {
  const tok = getToken(owner2);
  if (!tok || process.env.CS_OFFLINE) return void 0;
  try {
    const keys = await api("GET", `/repos/${owner2}/${repo}/keys`, tok);
    if (keys.some((k) => (k.key ?? "").split(" ").slice(0, 2).join(" ") === pub.split(" ").slice(0, 2).join(" "))) return "already a deploy key";
    await api("POST", `/repos/${owner2}/${repo}/keys`, tok, { title, key: pub, read_only: false });
    return "registered as deploy key (write)";
  } catch (e) {
    return `could not register via API: ${e.message}`;
  }
}
function instructions(pub, gh, machine) {
  const lines = [];
  if (gh) lines.push(`${cyan(`https://github.com/${gh[0]}/${gh[1]}/settings/keys/new`)}  ${dim('\u2192 deploy key, tick "Allow write access"')}`, "");
  lines.push(`title  ${bold(`cs:${machine}:master`)}`, `key    ${bold(pub)}`, "", dim("this key only reaches the config repo; identities get their own keys"));
  note2(lines, "Add this machine's master key to the config repo");
}
async function setup(repoDir2, interactive = true) {
  const url = remoteUrl(repoDir2);
  if (!url) {
    warn("config repo has no remote");
    return 1;
  }
  const [sshUrl, gh] = parseRepoUrl(url);
  const { pub, created } = ensureKey();
  kv("master key", KEY + (created ? "  (generated)" : ""));
  let [ok2] = canAccess(sshUrl);
  while (!ok2) {
    instructions(pub, gh, (await Promise.resolve().then(() => (init_config(), config_exports))).loadMachine().name);
    if (!interactive || !await proceed("added the key?")) return 1;
    [ok2] = canAccess(sshUrl);
  }
  if (sshUrl !== url) git(["remote", "set-url", "origin", sshUrl], repoDir2);
  configureRepo(repoDir2);
  ok(`config repo uses the master key (${sshUrl})`);
  return 0;
}
var KEY, keyPath2, httpsUrl, configureRepo;
var init_master = __esm({
  "src/master.ts"() {
    "use strict";
    init_git();
    init_github();
    init_paths();
    init_ui();
    KEY = "~/.ssh/cs/master";
    keyPath2 = () => expand(KEY);
    httpsUrl = (o, r2) => `https://github.com/${o}/${r2}.git`;
    configureRepo = (repoDir2) => git(["config", "core.sshCommand", `ssh -i ${KEY} -o IdentitiesOnly=yes`], repoDir2);
  }
});

// src/jsonmerge.ts
function deepMerge(base, over, path = "") {
  if (isObj(base) && isObj(over)) {
    const out2 = { ...base };
    for (const [k, v] of Object.entries(over)) out2[k] = k in base ? deepMerge(base[k], v, path ? `${path}.${k}` : k) : v;
    return out2;
  }
  if (Array.isArray(base) && Array.isArray(over) && UNION.has(path)) {
    const seen = new Set(base.map((x) => JSON.stringify(x)));
    const out2 = [...base];
    for (const x of over) {
      const k = JSON.stringify(x);
      if (!seen.has(k)) {
        seen.add(k);
        out2.push(x);
      }
    }
    return out2;
  }
  return over;
}
function diffKeys(a2, b, prefix = "") {
  const out2 = [];
  for (const k of [.../* @__PURE__ */ new Set([...Object.keys(a2), ...Object.keys(b)])].sort()) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (!(k in a2) || !(k in b)) out2.push(p);
    else if (isObj(a2[k]) && isObj(b[k])) out2.push(...diffKeys(a2[k], b[k], p));
    else if (JSON.stringify(a2[k]) !== JSON.stringify(b[k])) out2.push(p);
  }
  return out2;
}
var UNION, isObj, mergeLayers, dumps, loads;
var init_jsonmerge = __esm({
  "src/jsonmerge.ts"() {
    "use strict";
    UNION = /* @__PURE__ */ new Set(["permissions.allow", "permissions.deny", "permissions.ask", "permissions.additionalDirectories", "enabledMcpjsonServers", "disabledMcpjsonServers"]);
    isObj = (x) => !!x && typeof x === "object" && !Array.isArray(x);
    mergeLayers = (...layers) => layers.reduce((acc, l2) => deepMerge(acc, l2), {});
    dumps = (o) => JSON.stringify(o, null, 2) + "\n";
    loads = (t2) => t2.trim() ? JSON.parse(t2) : {};
  }
});

// src/apply.ts
var apply_exports = {};
__export(apply_exports, {
  applyGit: () => applyGit,
  applyLinks: () => applyLinks,
  applySettings: () => applySettings,
  applyShellRc: () => applyShellRc,
  renderGitIncludes: () => renderGitIncludes,
  renderSettings: () => renderSettings,
  runApply: () => runApply,
  settingsLayers: () => settingsLayers
});
import { existsSync as existsSync6, lstatSync, mkdirSync as mkdirSync4, readdirSync, readFileSync as readFileSync6, readlinkSync, renameSync, rmSync, statSync as statSync2, symlinkSync, unlinkSync as unlinkSync2, writeFileSync as writeFileSync4, copyFileSync } from "node:fs";
import { basename, dirname as dirname3, join as join6, resolve as resolve4 } from "node:path";
function backup(target) {
  const d = join6(stateDir(), "backups", stamp());
  mkdirSync4(d, { recursive: true });
  const dest = join6(d, basename(target));
  if (statSync2(target).isDirectory()) renameSync(target, dest);
  else {
    copyFileSync(target, dest);
    unlinkSync2(target);
  }
}
function mergeDirInto(src, dst) {
  const walk2 = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const f = join6(dir, e.name);
      if (e.isDirectory()) walk2(f);
      else {
        const rel = f.slice(dst.length + 1);
        const t2 = join6(src, rel);
        if (!existsSync6(t2)) {
          mkdirSync4(dirname3(t2), { recursive: true });
          renameSync(f, t2);
        }
      }
    }
  };
  walk2(dst);
  rmSync(dst, { recursive: true, force: true });
}
function link(src, dst, check, changes) {
  if (isLink(dst)) {
    if (resolve4(dirname3(dst), readlinkSync(dst)) === resolve4(src)) return;
    changes.push(`relink ${contract(dst)}`);
    if (!check) {
      unlinkSync2(dst);
      symlinkSync(src, dst);
    }
    return;
  }
  if (existsSync6(dst)) {
    if (statSync2(dst).isDirectory()) {
      changes.push(`adopt ${contract(dst)} \u2192 ${contract(src)} (merge)`);
      if (!check) {
        mkdirSync4(src, { recursive: true });
        mergeDirInto(src, dst);
        symlinkSync(src, dst);
      }
    } else if (!existsSync6(src)) {
      changes.push(`adopt ${contract(dst)} \u2192 ${contract(src)}`);
      if (!check) {
        mkdirSync4(dirname3(src), { recursive: true });
        renameSync(dst, src);
        symlinkSync(src, dst);
      }
    } else {
      changes.push(`replace ${contract(dst)} (backup kept)`);
      if (!check) {
        backup(dst);
        symlinkSync(src, dst);
      }
    }
    return;
  }
  if (!existsSync6(src)) return;
  changes.push(`link ${contract(dst)}`);
  if (!check) {
    mkdirSync4(dirname3(dst), { recursive: true });
    symlinkSync(src, dst);
  }
}
function settingsLayers(repo, m) {
  const names = ["settings.base.json", ...m.profiles.map((p) => `settings.${p}.json`), `settings.${m.name}.json`];
  return names.filter((n3) => existsSync6(join6(repo, "claude", n3))).map((n3) => [n3, loads(readFileSync6(join6(repo, "claude", n3), "utf8"))]);
}
function applySettings(repo, m, check, changes) {
  if (!settingsLayers(repo, m).length) return;
  const target = join6(claudeDir(), "settings.json");
  const desired = renderSettings(repo, m);
  const current = existsSync6(target) ? loads(readFileSync6(target, "utf8")) : {};
  if (JSON.stringify(current) === JSON.stringify(desired)) return;
  const keys = diffKeys(current, desired);
  changes.push(`settings.json: ${keys.slice(0, 8).join(", ")}${keys.length > 8 ? " \u2026" : ""}`);
  if (!check) {
    mkdirSync4(claudeDir(), { recursive: true });
    if (existsSync6(target)) {
      const d = join6(stateDir(), "backups", stamp());
      mkdirSync4(d, { recursive: true });
      copyFileSync(target, join6(d, "settings.json"));
    }
    writeFileSync4(target, dumps(desired));
  }
}
function applyLinks(repo, check, changes) {
  const cdir = claudeDir();
  mkdirSync4(cdir, { recursive: true });
  for (const item of LINK_ITEMS) link(join6(repo, "claude", item), join6(cdir, item), check, changes);
  const skills = join6(repo, "claude", "skills");
  if (existsSync6(skills)) {
    mkdirSync4(join6(cdir, "skills"), { recursive: true });
    for (const e of readdirSync(skills, { withFileTypes: true })) if (e.isDirectory()) link(join6(skills, e.name), join6(cdir, "skills", e.name), check, changes);
  }
  link(join6(repo, "plans"), join6(cdir, "plans"), check, changes);
}
function renderGitIncludes(man) {
  const gdir = join6(home(), ".config", "git");
  const files = {};
  const inc = ["# generated by `cs apply` \u2014 do not edit; edit projects.toml [identities] instead"];
  for (const i2 of Object.values(man.identities)) {
    files[join6(gdir, `identity-${i2.id}.inc`)] = [
      `# identity '${i2.id}' (generated by cs apply)`,
      "[user]",
      `	name = ${i2.name}`,
      `	email = ${i2.email}`,
      "[core]",
      `	sshCommand = ssh -i ${contract(expand(keyPath(i2)))} -o IdentitiesOnly=yes`
    ].join("\n") + "\n";
    for (const g of globs(i2)) inc.push(`[includeIf "hasconfig:remote.*.url:${g}"]`, `	path = identity-${i2.id}.inc`);
  }
  files[join6(gdir, "claude-share.inc")] = inc.join("\n") + "\n";
  return files;
}
function applyGit(man, check, changes) {
  const gdir = join6(home(), ".config", "git");
  const wanted = renderGitIncludes(man);
  if (existsSync6(gdir)) {
    for (const f of readdirSync(gdir)) if (/^identity-.*\.inc$/.test(f) && !(join6(gdir, f) in wanted)) {
      changes.push(`remove stale ${contract(join6(gdir, f))}`);
      if (!check) unlinkSync2(join6(gdir, f));
    }
  }
  for (const [f, content] of Object.entries(wanted)) {
    if (existsSync6(f) && readFileSync6(f, "utf8") === content) continue;
    changes.push(`write ${contract(f)}`);
    if (!check) {
      mkdirSync4(gdir, { recursive: true });
      writeFileSync4(f, content);
    }
  }
  const gc = join6(home(), ".gitconfig");
  const text3 = existsSync6(gc) ? readFileSync6(gc, "utf8") : "";
  const block3 = `${GIT_MARK}
[include]
	path = ~/.config/git/claude-share.inc
${GIT_END}
`;
  const next = text3.includes(GIT_MARK) ? text3.slice(0, text3.indexOf(GIT_MARK)) + block3 + text3.slice(text3.indexOf(GIT_END) + GIT_END.length + 1) : text3 + (text3 && !text3.endsWith("\n") ? "\n" : "") + block3;
  if (next !== text3) {
    changes.push("~/.gitconfig: include claude-share.inc");
    if (!check) writeFileSync4(gc, next);
  }
}
function applyShellRc(check, changes) {
  const rc = shellRc();
  const sh2 = contract(join6(toolRoot(), "shell", "cs.sh"));
  const block3 = `${GIT_MARK}
[ -f "${sh2}" ] && . "${sh2}"
${GIT_END}
`;
  const text3 = existsSync6(rc) ? readFileSync6(rc, "utf8") : "";
  const next = text3.includes(GIT_MARK) ? text3.slice(0, text3.indexOf(GIT_MARK)) + block3 + text3.slice(text3.indexOf(GIT_END) + GIT_END.length + 1) : text3 + (text3 && !text3.endsWith("\n") ? "\n" : "") + block3;
  if (next !== text3) {
    changes.push(`${contract(rc)}: source shell/cs.sh (claude() wrapper, PATH)`);
    if (!check) writeFileSync4(rc, next);
  }
}
function runApply(repo, m, man, check = false) {
  const changes = [];
  applySettings(repo, m, check, changes);
  applyLinks(repo, check, changes);
  applyGit(man, check, changes);
  applyShellRc(check, changes);
  for (const c2 of changes) check ? info(c2) : step(c2);
  if (!changes.length) ok("~/.claude up to date");
  return changes;
}
var LINK_ITEMS, GIT_MARK, GIT_END, stamp, isLink, renderSettings;
var init_apply = __esm({
  "src/apply.ts"() {
    "use strict";
    init_paths();
    init_platform();
    init_manifest();
    init_jsonmerge();
    init_ui();
    LINK_ITEMS = ["CLAUDE.md", "rules", "agents", "themes", "keybindings.json"];
    GIT_MARK = "# >>> claude-share >>>";
    GIT_END = "# <<< claude-share <<<";
    stamp = () => (/* @__PURE__ */ new Date()).toISOString().replace(/[-:]/g, "").slice(0, 15);
    isLink = (p) => {
      try {
        return lstatSync(p).isSymbolicLink();
      } catch {
        return false;
      }
    };
    renderSettings = (repo, m) => mergeLayers(...settingsLayers(repo, m).map(([, d]) => d));
  }
});

// src/link.ts
var link_exports = {};
__export(link_exports, {
  checkouts: () => checkouts,
  ensureExclude: () => ensureExclude,
  memoryDir: () => memoryDir,
  runLink: () => runLink,
  sideStore: () => sideStore,
  syncProject: () => syncProject
});
import { existsSync as existsSync7, mkdirSync as mkdirSync5, readdirSync as readdirSync2, readFileSync as readFileSync7, renameSync as renameSync2, statSync as statSync3, unlinkSync as unlinkSync3, utimesSync, writeFileSync as writeFileSync5 } from "node:fs";
import { dirname as dirname4, join as join7, relative as relative2 } from "node:path";
function checkouts(p, ws) {
  const root = checkoutRoot(p, ws);
  if (!existsSync7(root)) return [];
  if (p.kind !== "git" || !isRepo(root)) return [root];
  const w = worktrees(root);
  return w.length ? w : [root];
}
function walk(dir, fn, skipDir, base = dir) {
  if (!existsSync7(dir)) return;
  for (const e of readdirSync2(dir, { withFileTypes: true })) {
    const f = join7(dir, e.name);
    const rel = relative2(base, f);
    if (e.isDirectory()) {
      if (!skipDir?.(rel)) walk(f, fn, skipDir, base);
    } else if (e.isFile()) fn(rel);
  }
}
function managedRels(base) {
  const rels = /* @__PURE__ */ new Set();
  for (const f of ROOT_FILES) if (existsSync7(join7(base, f)) && statSync3(join7(base, f)).isFile()) rels.add(f);
  walk(join7(base, ".claude"), (rel) => {
    if (rel !== "settings.json") rels.add(".claude/" + rel);
  }, (rel) => SKIP_UNDER_CLAUDE.has(rel.split("/")[0]));
  return rels;
}
function sideRels(side) {
  const rels = /* @__PURE__ */ new Set();
  walk(side, (rel) => rels.add(rel), (rel) => NOT_SYNCED.has(rel.split("/")[0]));
  return rels;
}
function normalize(rel, data) {
  if (rel !== SETTINGS_LOCAL) return data;
  try {
    const d = JSON.parse(data.toString("utf8") || "{}");
    delete d.autoMemoryDirectory;
    return Buffer.from(Object.keys(d).length ? dumps(d) : "");
  } catch {
    return data;
  }
}
function localize(rel, data, mem) {
  if (rel !== SETTINGS_LOCAL) return data;
  let d = {};
  try {
    d = data.toString("utf8").trim() ? JSON.parse(data.toString("utf8")) : {};
  } catch {
  }
  d.autoMemoryDirectory = contract(mem);
  return Buffer.from(dumps(d));
}
function write(path, data, mtime) {
  mkdirSync5(dirname4(path), { recursive: true });
  const tmp = path + ".cs-tmp";
  writeFileSync5(tmp, data);
  if (mtime) utimesSync(tmp, mtime, mtime);
  renameSync2(tmp, path);
}
function ensureExclude(checkout, check, changes) {
  if (!existsSync7(join7(checkout, ".git"))) return;
  const ex = infoExclude(checkout);
  const text3 = existsSync7(ex) ? readFileSync7(ex, "utf8") : "";
  const missing = EXCLUDE_LINES.filter((l2) => !text3.split("\n").includes(l2));
  if (!missing.length) return;
  changes.push(`exclude ${missing.join(", ")} in ${contract(checkout)}`);
  if (!check) {
    mkdirSync5(dirname4(ex), { recursive: true });
    writeFileSync5(ex, text3 + (!text3 || text3.endsWith("\n") ? "" : "\n") + "# claude-share managed files\n" + missing.join("\n") + "\n");
  }
}
function syncProject(repo, p, ws, check = false) {
  const changes = [];
  const side = sideStore(repo, p);
  const targets = checkouts(p, ws);
  if (!targets.length) return changes;
  const mem = memoryDir(repo, p);
  if (!existsSync7(mem) && !check) mkdirSync5(mem, { recursive: true });
  const previously = loadState(p);
  const all = new Set(sideRels(side));
  for (const t2 of targets) for (const r2 of managedRels(t2)) all.add(r2);
  all.add(SETTINGS_LOCAL);
  const final = /* @__PURE__ */ new Set();
  for (const rel of [...all].sort()) {
    const sp = join7(side, rel);
    const sideExists = existsSync7(sp) && statSync3(sp).isFile();
    const sideData = sideExists ? normalize(rel, readFileSync7(sp)) : void 0;
    const sideMtime = sideExists ? statSync3(sp).mtimeMs / 1e3 : -1;
    let best = sideData, bestM = sideMtime, from = "side-store";
    for (const t2 of targets) {
      const tp = join7(t2, rel);
      if (existsSync7(tp) && statSync3(tp).isFile()) {
        const d = normalize(rel, readFileSync7(tp));
        const mt = statSync3(tp).mtimeMs / 1e3;
        if ((!best || !d.equals(best)) && mt > bestM + 1e-6) {
          best = d;
          bestM = mt;
          from = contract(t2);
        }
      }
    }
    if (!sideExists && previously.has(rel) && rel !== SETTINGS_LOCAL) {
      for (const t2 of targets) {
        const tp = join7(t2, rel);
        if (existsSync7(tp)) {
          changes.push(`remove ${rel} from ${contract(t2)} (deleted in side-store)`);
          if (!check) unlinkSync3(tp);
        }
      }
      continue;
    }
    if (best === void 0) {
      if (rel === SETTINGS_LOCAL) {
        best = Buffer.alloc(0);
        bestM = sideMtime;
      } else continue;
    }
    if ((!sideData || !best.equals(sideData)) && (best.length || rel !== SETTINGS_LOCAL)) {
      changes.push(`side-store \u2190 ${rel} (from ${from})`);
      if (!check) write(sp, best, bestM > 0 ? bestM : void 0);
    }
    if (best.length || rel !== SETTINGS_LOCAL) final.add(rel);
    for (const t2 of targets) {
      const tp = join7(t2, rel);
      const want = localize(rel, best, mem);
      const have = existsSync7(tp) && statSync3(tp).isFile() ? readFileSync7(tp) : void 0;
      if (!have || !have.equals(want)) {
        changes.push(`${contract(t2)}/${rel} \u2190 side-store`);
        if (!check) write(tp, want, bestM > 0 ? bestM : void 0);
      }
    }
  }
  for (const t2 of targets) ensureExclude(t2, check, changes);
  if (!check) saveState(p, final);
  return changes;
}
function runLink(repo, m, man, names = [], check = false) {
  const ws = workspace(man, m);
  const unknown = names.filter((n3) => !man.projects[n3]);
  if (unknown.length) throw new Error(`cs: unknown project(s): ${unknown.join(", ")}`);
  let total = 0;
  for (const p of selectedProjects(man, m)) {
    if (names.length && !names.includes(p.name)) continue;
    if (!checkouts(p, ws).length) continue;
    const ch = syncProject(repo, p, ws, check);
    for (const c2 of ch) check ? info(`${p.name}: ${c2}`) : step(`${p.name}: ${c2}`);
    total += ch.length;
  }
  if (!total) ok("project files in sync");
  return total;
}
var ROOT_FILES, SKIP_UNDER_CLAUDE, EXCLUDE_LINES, SETTINGS_LOCAL, NOT_SYNCED, sideStore, memoryDir, stateFile, loadState, saveState;
var init_link = __esm({
  "src/link.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_manifest();
    init_jsonmerge();
    init_ui();
    ROOT_FILES = ["CLAUDE.md", "CLAUDE.local.md", ".mcp.json"];
    SKIP_UNDER_CLAUDE = /* @__PURE__ */ new Set(["worktrees", "plans", "settings.json"]);
    EXCLUDE_LINES = [".claude/", ".mcp.json", "CLAUDE.md", "CLAUDE.local.md"];
    SETTINGS_LOCAL = ".claude/settings.local.json";
    NOT_SYNCED = /* @__PURE__ */ new Set(["memory", "secrets"]);
    sideStore = (repo, p) => join7(repo, "projects", p.name);
    memoryDir = (repo, p) => join7(sideStore(repo, p), "memory");
    stateFile = (p) => join7(stateDir(), "link", `${p.name}.json`);
    loadState = (p) => {
      try {
        return new Set(JSON.parse(readFileSync7(stateFile(p), "utf8")).files);
      } catch {
        return /* @__PURE__ */ new Set();
      }
    };
    saveState = (p, files) => {
      mkdirSync5(dirname4(stateFile(p)), { recursive: true });
      writeFileSync5(stateFile(p), JSON.stringify({ files: [...files].sort() }, null, 2));
    };
  }
});

// src/deps.ts
var deps_exports = {};
__export(deps_exports, {
  runDeps: () => runDeps,
  which: () => which
});
import { chmodSync as chmodSync3, copyFileSync as copyFileSync2, existsSync as existsSync8, mkdirSync as mkdirSync6, rmSync as rmSync2 } from "node:fs";
import { join as join8 } from "node:path";
import { spawnSync as spawnSync3 } from "node:child_process";
import { arch } from "node:os";
function which(cmd) {
  for (const d of [...(process.env.PATH ?? "").split(":"), BIN()]) if (d && existsSync8(join8(d, cmd))) return join8(d, cmd);
  return void 0;
}
async function latest(repo) {
  const r2 = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers: { "User-Agent": "claude-share" } });
  return (await r2.json()).tag_name;
}
async function download(url, dest) {
  const r2 = await fetch(url, { headers: { "User-Agent": "claude-share" } });
  if (!r2.ok) throw new Error(`download failed: ${url}`);
  const { writeFileSync: writeFileSync15 } = await import("node:fs");
  writeFileSync15(dest, Buffer.from(await r2.arrayBuffer()));
}
async function sopsLinux() {
  const t2 = await latest("getsops/sops");
  mkdirSync6(BIN(), { recursive: true });
  await download(`https://github.com/getsops/sops/releases/download/${t2}/sops-${t2}.linux.${a64()}`, join8(BIN(), "sops"));
  chmodSync3(join8(BIN(), "sops"), 493);
}
async function ageLinux() {
  const t2 = await latest("FiloSottile/age");
  const tmp = join8(home(), ".cache", "cs-age");
  mkdirSync6(tmp, { recursive: true });
  const tgz = join8(tmp, "age.tgz");
  await download(`https://github.com/FiloSottile/age/releases/download/${t2}/age-${t2}-linux-${a64()}.tar.gz`, tgz);
  sh(`tar -xzf ${tgz} -C ${tmp}`);
  mkdirSync6(BIN(), { recursive: true });
  for (const n3 of ["age", "age-keygen"]) {
    copyFileSync2(join8(tmp, "age", n3), join8(BIN(), n3));
    chmodSync3(join8(BIN(), n3), 493);
  }
  rmSync2(tmp, { recursive: true, force: true });
}
async function runDeps(install = false, compact = false) {
  const rows = [];
  let missingRequired = false;
  const apt = [];
  const present = [];
  const installed = [];
  const optional = [];
  for (const [name2, it] of Object.entries(CATALOG)) {
    let path = which(it.cmd);
    if (path) {
      rows.push([green("\u2713"), name2, dim(ver(it.ver).slice(0, 40))]);
      present.push(name2);
      continue;
    }
    const inst = isMac() ? it.mac : it.linux;
    if (install && inst) {
      try {
        await spin(`installing ${name2}\u2026`, async () => inst());
        path = which(it.cmd);
      } catch (e) {
        warn(`${name2}: install failed: ${e.message}`);
      }
    }
    if (path) {
      rows.push([green("\u2713"), name2, dim("installed")]);
      installed.push(name2);
      continue;
    }
    if (it.required) missingRequired = true;
    if (!isMac() && it.apt) apt.push(it.apt);
    if (!it.required) optional.push(name2 + (it.apt && !isMac() ? ` (sudo apt install -y ${it.apt})` : it.mac ? ` (brew install ${name2})` : ""));
    rows.push([it.required ? red("\u2717") : yellow("!"), name2, dim("missing")]);
  }
  if (compact) {
    step(`${present.length + installed.length} tools ready${installed.length ? ` (installed ${installed.join(", ")})` : ""}`);
    if (optional.length) step(`optional: ${optional.join(", ")}`);
    for (const r2 of rows) if (r2[0].includes("\u2717")) step(`missing: ${r2[1]}`);
  } else {
    table(rows);
    if (optional.length) info(dim("optional: " + optional.join(", ")));
  }
  if (missingRequired && apt.length) info(bold("sudo apt install -y " + apt.join(" ")));
  if (!install && !compact && rows.some((r2) => !r2[0].includes("\u2713"))) info(dim("cs deps --install  installs the user-local ones (age, sops, claude)"));
  if (!(process.env.PATH ?? "").split(":").includes(BIN())) warn(`${contract(BIN())} is not on PATH (cs apply adds it to your shell rc)`);
  return missingRequired ? 1 : 0;
}
var BIN, ver, a64, sh, brew, CATALOG;
var init_deps = __esm({
  "src/deps.ts"() {
    "use strict";
    init_paths();
    init_platform();
    init_ui();
    BIN = () => join8(home(), ".local", "bin");
    ver = (args) => {
      const p = spawnSync3(args[0], args.slice(1), { encoding: "utf8", timeout: 1e4 });
      return ((p.stdout || p.stderr || "").split("\n")[0] ?? "").trim();
    };
    a64 = () => ["arm64", "aarch64"].includes(arch()) ? "arm64" : "amd64";
    sh = (cmd) => {
      const p = spawnSync3("bash", ["-lc", cmd], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      if (p.status !== 0) throw new Error(`command failed: ${cmd}
${(p.stderr || p.stdout || "").trim().split("\n").slice(-5).join("\n")}`);
    };
    brew = (pkg2) => async () => sh(`brew install ${pkg2}`);
    CATALOG = {
      git: { cmd: "git", ver: ["git", "--version"], mac: brew("git"), required: true, apt: "git" },
      curl: { cmd: "curl", ver: ["curl", "--version"], required: true, apt: "curl" },
      ssh: { cmd: "ssh", ver: ["ssh", "-V"], required: true, apt: "openssh-client" },
      age: { cmd: "age", ver: ["age", "--version"], linux: ageLinux, mac: brew("age"), required: true },
      sops: { cmd: "sops", ver: ["sops", "--version"], linux: sopsLinux, mac: brew("sops"), required: true },
      node: { cmd: "node", ver: ["node", "--version"], required: true },
      gh: { cmd: "gh", ver: ["gh", "--version"], mac: brew("gh"), required: false, apt: "gh" },
      claude: { cmd: "claude", ver: ["claude", "--version"], linux: async () => sh("curl -fsSL https://claude.ai/install.sh | bash"), mac: async () => sh("curl -fsSL https://claude.ai/install.sh | bash"), required: true }
    };
  }
});

// src/doctor.ts
var doctor_exports = {};
__export(doctor_exports, {
  fix: () => fix,
  runDoctor: () => runDoctor
});
import { existsSync as existsSync9, lstatSync as lstatSync2, readFileSync as readFileSync8 } from "node:fs";
import { join as join9 } from "node:path";
function fix(repo, m, man) {
  const ws = workspace(man, m);
  for (const p of selectedProjects(man, m)) {
    const root = checkoutRoot(p, ws);
    if (p.kind !== "git" || !existsSync9(root) || !isRepo(root) || !p.url) continue;
    const url = remoteUrl(root);
    if (url === p.url) continue;
    const cur = canonicalGithub(url), want = canonicalGithub(p.url);
    let same = cur === want;
    const ident2 = p.identity ? man.identities[p.identity] : void 0;
    if (!same && ident2 && identityMatches(ident2, cur) && cur.split("/").pop() === want.split("/").pop()) same = true;
    if (same) {
      git(["remote", "set-url", "origin", p.url], root);
      ok(`${p.name}: remote url ${url} \u2192 ${p.url}`);
    } else warn(`${p.name}: remote ${url} is a different repo than manifest ${p.url}; not changing it`);
  }
}
function runDoctor(repo, m, man, doFix = false, compact = false) {
  if (doFix) fix(repo, m, man);
  const res = [];
  refuseUnsupported();
  res.push(["ok", describe()]);
  res.push(["ok", `node ${process.versions.node}`]);
  const v = version();
  res.push(v[0] > 2 || v[0] === 2 && v[1] >= 36 ? ["ok", `git ${v.join(".")}`] : ["warn", `git ${v.join(".")} < 2.36: identities fall back to per-repo config`]);
  res.push(which("claude") ? ["ok", `claude at ${which("claude")}`] : ["warn", "claude not on PATH (curl -fsSL https://claude.ai/install.sh | bash)"]);
  const ws = workspace(man, m);
  res.push(isWSL() && ws.startsWith("/mnt/") ? ["fail", `workspace ${ws} is on the Windows filesystem; use the WSL home`] : ["ok", `workspace ${contract(ws)}`]);
  const broken = LINKS.filter((i2) => {
    try {
      return lstatSync2(join9(claudeDir(), i2)).isSymbolicLink() && !existsSync9(join9(claudeDir(), i2));
    } catch {
      return false;
    }
  });
  res.push(broken.length ? ["fail", "broken links in ~/.claude: " + broken.join(", ") + "  (cs apply)"] : ["ok", "~/.claude links healthy"]);
  const ch = [];
  applySettings(repo, m, true, ch);
  res.push(ch.length ? ["warn", "settings.json drift: " + ch.join("; ") + "  (cs apply)"] : ["ok", "settings.json rendered"]);
  if (existsSync9(claudeJson())) {
    try {
      const d = JSON.parse(readFileSync8(claudeJson(), "utf8"));
      const hits = [];
      for (const [path, e] of Object.entries(d.projects ?? {})) for (const [n3, c2] of Object.entries(e.mcpServers ?? {})) if (c2.env || c2.headers) hits.push(`${n3}@${contract(path)}`);
      res.push(hits.length ? ["warn", `local-scope MCP servers with secrets in ~/.claude.json (machine-only): ${hits.join(", ")} \u2014 keep until cs secrets provides the \${VAR}s, then \`claude mcp remove <name> -s local\``] : ["ok", "no secret-bearing local-scope MCP servers"]);
    } catch {
      res.push(["warn", "~/.claude.json unparsable"]);
    }
  }
  res.push(process.env.GH_TOKEN || process.env.GITHUB_TOKEN ? ["warn", "GH_TOKEN/GITHUB_TOKEN is exported in this shell; gh ignores its stored logins while set"] : ["ok", "no GH_TOKEN override in env"]);
  const idr = [];
  for (const p of selectedProjects(man, m)) {
    const root = checkoutRoot(p, ws);
    if (p.kind !== "git" || !existsSync9(root) || !isRepo(root)) continue;
    const ident2 = p.identity ? man.identities[p.identity] : void 0;
    const email2 = configGet(root, "user.email");
    const url = remoteUrl(root);
    if (p.url && canonicalGithub(url) !== canonicalGithub(p.url)) idr.push(["warn", `${p.name}: remote ${url} \u2260 manifest ${p.url}  (cs doctor --fix)`]);
    else if (url && p.url && url !== p.url) idr.push(["warn", `${p.name}: remote uses alias/other form ${url}; manifest ${p.url}  (cs doctor --fix)`]);
    if (ident2 && email2 !== ident2.email) idr.push(["fail", `${p.name}: user.email resolves to '${email2 || "UNSET"}', expected ${ident2.email}`]);
  }
  res.push(...idr.length ? idr : [["ok", "git identities resolve per manifest"]]);
  const sym = { ok: green("\u2713"), warn: yellow("!"), fail: red("\u2717") };
  if (compact) {
    const bad = res.filter(([l2]) => l2 !== "ok");
    if (bad.length) table(bad.map(([l2, msg]) => [sym[l2], msg]));
    step(`${res.length - bad.length} of ${res.length} checks passed`);
  } else table(res.map(([l2, msg]) => [sym[l2], msg]));
  return res.some(([l2]) => l2 === "fail") ? 1 : 0;
}
var LINKS;
var init_doctor = __esm({
  "src/doctor.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_platform();
    init_manifest();
    init_apply();
    init_ui();
    init_deps();
    LINKS = ["CLAUDE.md", "rules", "agents", "themes", "keybindings.json", "plans"];
  }
});

// src/identity.ts
var identity_exports = {};
__export(identity_exports, {
  add: () => add,
  ls: () => ls,
  rename: () => rename
});
import { existsSync as existsSync10, renameSync as renameSync3, readFileSync as readFileSync9, writeFileSync as writeFileSync6 } from "node:fs";
import { join as join10 } from "node:path";
async function add(repo, m, man, id, o) {
  if (!NAME_RE.test(id)) throw new Error(`cs: '${id}' is not a valid identity id`);
  const ident2 = { id, name: o.name, email: o.email, owner: o.owner, sshKey: o.key };
  appendIdentity(repo, ident2);
  git(["add", "projects.toml"], repo);
  commit(repo, `identities: add ${id}`, "cs", `cs@${m.name}`);
  step(`identity ${bold(id)}  ${dim(`${o.name} <${o.email}> \xB7 github.com/${o.owner} \xB7 key ${keyPath(ident2)}`)}`);
  const ch = [];
  applyGit(loadManifest(repo), false, ch);
  if (ch.length) step("git identity includes updated");
  if (!existsSync10(expand(keyPath(ident2)))) info(`no key at ${keyPath(ident2)} yet \u2014 cs ssh setup generates and registers it`);
  if (!o.noToken && !getToken(o.owner)) {
    info(`a GitHub token for ${o.owner} lets cs new --${id} create repos:`);
    try {
      await ensureToken(o.owner);
      ok(`token for ${o.owner} stored`);
    } catch (e) {
      warn(`no token stored (${e.message}); run cs token set ${o.owner} later`);
    }
  }
  return 0;
}
function rename(repo, m, man, oldId, newId) {
  if (!man.identities[oldId]) throw new Error(`cs: unknown identity '${oldId}'`);
  if (man.identities[newId] || !NAME_RE.test(newId)) throw new Error(`cs: '${newId}' is taken or invalid`);
  const ident2 = man.identities[oldId];
  const f = join10(repo, "projects.toml");
  let t2 = readFileSync9(f, "utf8");
  t2 = t2.replace(new RegExp(`^\\[identities\\.${oldId}\\]`, "m"), `[identities.${newId}]`).replace(new RegExp(`^(identity\\s*=\\s*)"${oldId}"`, "mg"), `$1"${newId}"`);
  writeFileSync6(f, t2);
  if (!ident2.sshKey) {
    for (const s of ["", ".pub"]) {
      const a2 = expand(`~/.ssh/cs/${oldId}${s}`), b = expand(`~/.ssh/cs/${newId}${s}`);
      if (existsSync10(a2)) renameSync3(a2, b);
    }
    step(`~/.ssh/cs/${oldId} \u2192 ~/.ssh/cs/${newId}`);
  }
  for (const d of out(["ls-files", `machines/*/ssh/${oldId}.pub`], repo).split("\n").filter(Boolean)) git(["mv", d, d.replace(`${oldId}.pub`, `${newId}.pub`)], repo);
  git(["add", "projects.toml"], repo);
  commit(repo, `identities: rename ${oldId} \u2192 ${newId}`, "cs", `cs@${m.name}`);
  const n3 = Object.values(man.projects).filter((p) => p.identity === oldId).length;
  ok(`identity ${oldId} \u2192 ${newId} (${n3} projects updated)`);
  const ch = [];
  applyGit(loadManifest(repo), false, ch);
  for (const c2 of ch) step(c2);
  return 0;
}
function ls(man) {
  const ids = Object.values(man.identities);
  if (!ids.length) {
    info('no identities \u2014 add one: cs identity add personal --owner <github-user> --name ".." --email ..');
    return;
  }
  table(
    ids.map((i2) => {
      const n3 = Object.values(man.projects).filter((p) => p.identity === i2.id).length;
      const key = expand(keyPath(i2));
      return [bold(i2.id), `${i2.name} <${i2.email}>`, i2.owner || dim("-"), existsSync10(key) ? keyPath(i2) : red(keyPath(i2) + " (missing)"), getToken(i2.owner) ? green("token \u2713") : dim("no token"), dim(`${n3} project${n3 === 1 ? "" : "s"}`)];
    }),
    ["id", "commits as", "github owner", "ssh key", "", ""]
  );
  info(dim("use as: cs new <name> --<id>   (or --<github owner>)"));
}
var init_identity = __esm({
  "src/identity.ts"() {
    "use strict";
    init_git();
    init_github();
    init_paths();
    init_manifest();
    init_apply();
    init_ui();
  }
});

// src/ssh.ts
var ssh_exports = {};
__export(ssh_exports, {
  githubUserForKey: () => githubUserForKey,
  setup: () => setup2,
  writeSshConfig: () => writeSshConfig
});
import { chmodSync as chmodSync4, existsSync as existsSync11, mkdirSync as mkdirSync7, readFileSync as readFileSync10, writeFileSync as writeFileSync7 } from "node:fs";
import { dirname as dirname5, join as join11 } from "node:path";
import { spawnSync as spawnSync4 } from "node:child_process";
function keygen(key, comment) {
  mkdirSync7(dirname5(key), { recursive: true, mode: 448 });
  const p = spawnSync4("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-C", comment, "-f", key]);
  if (p.status !== 0) throw new Error("cs: ssh-keygen failed");
  chmodSync4(key, 384);
}
function githubUserForKey(key) {
  if (process.env.CS_OFFLINE) return void 0;
  const p = spawnSync4("ssh", ["-T", "-i", key, "-o", "IdentitiesOnly=yes", "-o", "StrictHostKeyChecking=accept-new", "-o", "BatchMode=yes", "git@github.com"], { encoding: "utf8", timeout: 2e4, stdio: ["ignore", "pipe", "pipe"] });
  return ((p.stdout ?? "") + (p.stderr ?? "")).match(/Hi ([^!]+)!/)?.[1];
}
function writeSshConfig() {
  const cfg = join11(home(), ".ssh", "config");
  const text3 = existsSync11(cfg) ? readFileSync10(cfg, "utf8") : "";
  const block3 = [MARK, "Host github.com", "    IdentitiesOnly yes", "    AddKeysToAgent yes", ...isMac() ? ["    UseKeychain yes"] : [], END].join("\n") + "\n";
  const next = text3.includes(MARK) ? text3.slice(0, text3.indexOf(MARK)) + block3 + text3.slice(text3.indexOf(END) + END.length + 1) : block3 + (text3 && !text3.startsWith("\n") ? "\n" : "") + text3;
  if (next === text3) return false;
  mkdirSync7(dirname5(cfg), { recursive: true, mode: 448 });
  writeFileSync7(cfg, next);
  chmodSync4(cfg, 384);
  return true;
}
async function register(i2, pub, title) {
  if (process.env.CS_OFFLINE) return "offline";
  if (!i2.owner) return "no owner; add the key manually";
  const tok = getToken(i2.owner);
  if (!tok) return `no token for ${i2.owner}; add manually: https://github.com/settings/ssh/new`;
  try {
    if (await ownerType(i2.owner, tok) !== "User") return `${i2.owner} is an organization \u2014 add the key to the user account that belongs to it: https://github.com/settings/ssh/new`;
    const keys = await api("GET", "/user/keys", tok);
    if (keys.some((k) => (k.key ?? "").split(" ").slice(0, 2).join(" ") === pub.split(" ").slice(0, 2).join(" "))) return "already registered on GitHub";
    await api("POST", "/user/keys", tok, { title, key: pub });
    return "registered on GitHub";
  } catch (e) {
    return /403|404/.test(e.message) ? "token lacks 'Git SSH keys: write' \u2014 add manually: https://github.com/settings/ssh/new" : e.message;
  }
}
async function setup2(repo, m, man, checkOnly = false) {
  const ids = Object.values(man.identities);
  if (!ids.length) {
    warn("no identities yet (cs identity add \u2026)");
    return 0;
  }
  const rows = [];
  let published = false;
  const unregistered = [];
  for (const i2 of ids) {
    const key = expand(keyPath(i2)), pubf = key + ".pub";
    const state = [];
    if (!existsSync11(key)) {
      if (checkOnly) {
        rows.push([i2.id, keyPath(i2), red("missing")]);
        unregistered.push(i2);
        continue;
      }
      keygen(key, `cs:${m.name}:${i2.id}`);
      state.push(green("generated"));
    }
    const pub = readFileSync10(pubf, "utf8").trim();
    const dest = join11(repo, "machines", m.name, "ssh", `${i2.id}.pub`);
    if (!checkOnly && (!existsSync11(dest) || readFileSync10(dest, "utf8").trim() !== pub)) {
      mkdirSync7(dirname5(dest), { recursive: true });
      writeFileSync7(dest, pub + "\n");
      git(["add", dest], repo);
      published = true;
    }
    let user = await spin(`verifying ${i2.id} key on GitHub\u2026`, async () => githubUserForKey(key));
    if (user) state.push(green(`github: ${user}`));
    else if (!checkOnly) {
      const r2 = await spin(`registering ${i2.id} key\u2026`, async () => register(i2, pub, `cs:${m.name}:${i2.id}`));
      user = githubUserForKey(key);
      if (user) state.push(green(`github: ${user}`));
      else {
        state.push(yellow(r2.startsWith("registered") ? "registered, not verified yet" : "needs registering"));
        unregistered.push(i2);
      }
    } else {
      state.push(yellow("not accepted by GitHub yet"));
      unregistered.push(i2);
    }
    rows.push([i2.id, keyPath(i2), state.join("  ")]);
  }
  if (published) commit(repo, `machines: ${m.name} ssh public keys`, "cs", `cs@${m.name}`);
  if (!checkOnly && writeSshConfig()) step("~/.ssh/config: managed block (IdentitiesOnly, AddKeysToAgent)");
  table(rows, ["identity", "key", "state"]);
  for (const i2 of unregistered) {
    const pubf = expand(keyPath(i2)) + ".pub";
    if (!existsSync11(pubf)) continue;
    const who = i2.owner && i2.owner.toLowerCase() !== i2.id.toLowerCase() ? `the ${i2.owner} account` : `your GitHub account that is a member of ${i2.owner || "the org"}`;
    note2([`${cyan("https://github.com/settings/ssh/new")}  ${dim(`\u2192 logged in as ${who}`)}`, "", `title  ${bold(`cs:${m.name}:${i2.id}`)}`, `key    ${bold(readFileSync10(pubf, "utf8").trim())}`], `Add the ${i2.id} key`);
  }
  return unregistered.length ? 1 : 0;
}
var MARK, END;
var init_ssh = __esm({
  "src/ssh.ts"() {
    "use strict";
    init_git();
    init_github();
    init_paths();
    init_platform();
    init_manifest();
    init_ui();
    MARK = "# >>> claude-share >>>";
    END = "# <<< claude-share <<<";
  }
});

// src/secrets/sops.ts
var sops_exports = {};
__export(sops_exports, {
  SopsBackend: () => SopsBackend,
  keyFile: () => keyFile,
  machinePubFile: () => machinePubFile,
  publicKey: () => publicKey,
  recipients: () => recipients,
  updatekeys: () => updatekeys,
  writeRecipients: () => writeRecipients
});
import { chmodSync as chmodSync5, copyFileSync as copyFileSync3, existsSync as existsSync12, mkdirSync as mkdirSync8, readdirSync as readdirSync4, readFileSync as readFileSync11, rmSync as rmSync3, writeFileSync as writeFileSync8 } from "node:fs";
import { dirname as dirname6, join as join12, relative as relative3 } from "node:path";
import { spawnSync as spawnSync5 } from "node:child_process";
function sops(args, repo, input, check = true) {
  const p = spawnSync5(exe("sops"), args, { cwd: repo, env: env(), encoding: "utf8", input, stdio: ["pipe", "pipe", "pipe"] });
  if (check && p.status !== 0) throw new Error(`cs: sops ${args.join(" ")} failed: ${(p.stderr ?? "").trim()}`);
  return p;
}
function publicKey() {
  if (!existsSync12(keyFile())) return "";
  const line = readFileSync11(keyFile(), "utf8").split("\n").find((l2) => l2.startsWith("# public key:"));
  if (line) return line.split(":")[1].trim();
  return (spawnSync5(exe("age-keygen"), ["-y", keyFile()], { encoding: "utf8" }).stdout ?? "").trim();
}
function keygen2() {
  mkdirSync8(dirname6(keyFile()), { recursive: true, mode: 448 });
  const p = spawnSync5(exe("age-keygen"), ["-o", keyFile()], { encoding: "utf8" });
  if (p.status !== 0) throw new Error(`cs: age-keygen failed: ${p.stderr}`);
  chmodSync5(keyFile(), 384);
}
function recipients(repo) {
  const f = join12(repo, ".sops.yaml");
  if (!existsSync12(f)) return [];
  const t2 = readFileSync11(f, "utf8");
  const m = t2.match(/age:\s*>-?\s*\n((?:\s+.+\n?)+)/);
  if (m) return m[1].replace(/\n/g, " ").split(",").map((x) => x.trim()).filter(Boolean);
  const m2 = t2.match(/age:\s*(\S.*)/);
  return m2 ? m2[1].split(",").map((x) => x.trim()).filter(Boolean) : [];
}
function writeRecipients(repo, recs) {
  writeFileSync8(join12(repo, ".sops.yaml"), `# sops recipients \u2014 managed by cs secrets init / cs enroll / cs revoke
creation_rules:
  - path_regex: ${RULE}
    age: >-
` + recs.map((r2) => `      ${r2}`).join(",\n") + "\n");
}
function envFiles(repo) {
  const out2 = [];
  const rec = (d) => {
    if (!existsSync12(d)) return;
    for (const e of readdirSync4(d, { withFileTypes: true })) {
      const f = join12(d, e.name);
      e.isDirectory() ? rec(f) : f.endsWith(".env") && out2.push(f);
    }
  };
  rec(join12(repo, "secrets"));
  return out2.sort();
}
function updatekeys(repo) {
  let n3 = 0;
  for (const f of envFiles(repo)) if (isEncrypted(f)) {
    sops(["updatekeys", "-y", relative3(repo, f)], repo);
    n3++;
  }
  return n3;
}
var RULE, keyFile, env, exe, machinePubFile, isEncrypted, SopsBackend;
var init_sops = __esm({
  "src/secrets/sops.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_deps();
    init_secrets();
    init_ui();
    RULE = "^secrets/.*\\.env$";
    keyFile = () => process.env.SOPS_AGE_KEY_FILE || join12(home(), ".config", "sops", "age", "keys.txt");
    env = () => {
      const e = { ...process.env, SOPS_AGE_KEY_FILE: keyFile() };
      delete e.SOPS_AGE_RECIPIENTS;
      return e;
    };
    exe = (n3) => which(n3) || join12(home(), ".local", "bin", n3);
    machinePubFile = (repo, machine) => join12(repo, "machines", machine, "age.pub");
    isEncrypted = (f) => {
      try {
        return readFileSync11(f, "utf8").includes("sops_version=");
      } catch {
        return false;
      }
    };
    SopsBackend = {
      name: "sops",
      async init(repo, m) {
        if (existsSync12(keyFile())) skip(`age key present at ${contract(keyFile())}`);
        else {
          keygen2();
          ok(`generated age key ${contract(keyFile())} (0600, never synced)`);
        }
        const pub = publicKey();
        const pf = machinePubFile(repo, m.name);
        if (!existsSync12(pf) || readFileSync11(pf, "utf8").trim() !== pub) {
          mkdirSync8(dirname6(pf), { recursive: true });
          writeFileSync8(pf, pub + "\n");
          git(["add", relative3(repo, pf)], repo);
          commit(repo, `machines: ${m.name} age.pub`, "cs", `cs@${m.name}`);
          ok(`published ${contract(pf)}`);
        }
        const recs = recipients(repo);
        if (!recs.length) {
          writeRecipients(repo, [pub]);
          git(["add", ".sops.yaml"], repo);
          commit(repo, "secrets: first recipient", "cs", `cs@${m.name}`);
          ok("this is the first machine: registered as the only recipient");
          const hook = join12(repo, ".git", "hooks", "pre-commit"), src = join12(toolRoot(), "hooks", "pre-commit-secrets-guard.sh");
          if (existsSync12(src) && !existsSync12(hook)) {
            copyFileSync3(src, hook);
            chmodSync5(hook, 493);
            ok("installed pre-commit plaintext guard in the config repo");
          }
        } else if (recs.includes(pub)) ok("this machine can decrypt secrets");
        else warn(`this machine is not a recipient yet \u2014 on a machine that is, run: cs enroll ${m.name}`);
        mkdirSync8(join12(repo, "secrets", "projects"), { recursive: true });
      },
      ready: (repo) => existsSync12(keyFile()) && recipients(repo).includes(publicKey()),
      loadEnv(repo, name2) {
        const f = envFile(repo, name2);
        if (!existsSync12(f)) return {};
        return parseDotenv(sops(["-d", "--input-type", "dotenv", "--output-type", "dotenv", relative3(repo, f)], repo).stdout);
      },
      writeEnv(repo, name2, values) {
        const f = envFile(repo, name2);
        mkdirSync8(dirname6(f), { recursive: true });
        const rel = relative3(repo, f);
        const tmp = join12(dirname6(f), `.${name2.replace(/\//g, "_")}.plain.${process.pid}.env`);
        writeFileSync8(tmp, dumpDotenv(values), { mode: 384 });
        try {
          const p = sops(["-e", "--input-type", "dotenv", "--output-type", "dotenv", "--filename-override", rel, relative3(repo, tmp)], repo);
          writeFileSync8(f, p.stdout);
        } finally {
          rmSync3(tmp, { force: true });
        }
        return f;
      },
      edit(repo, name2) {
        const f = envFile(repo, name2);
        if (!existsSync12(f)) this.writeEnv(repo, name2, { EXAMPLE_KEY: "value" });
        spawnSync5(exe("sops"), ["--input-type", "dotenv", "--output-type", "dotenv", relative3(repo, f)], { cwd: repo, env: env(), stdio: "inherit" });
      },
      status(repo, m) {
        const pub = publicKey(), recs = recipients(repo);
        kv("age key", contract(keyFile()) + (existsSync12(keyFile()) ? "" : red("  missing")));
        kv("recipient", pub && recs.includes(pub) ? green("yes") : red("no \u2014 cs enroll " + m.name));
        const names = {};
        const md = join12(repo, "machines");
        if (existsSync12(md)) for (const d of readdirSync4(md)) {
          const pf = join12(md, d, "age.pub");
          if (existsSync12(pf)) names[readFileSync11(pf, "utf8").trim()] = d;
        }
        kv("recipients", recs.map((r2) => names[r2] ?? r2.slice(0, 14) + "\u2026").join(", ") || "-");
        kv("files", envFiles(repo).map((f) => relative3(repo, f)).join(", ") || "-");
      }
    };
  }
});

// src/secrets/none.ts
var none_exports = {};
__export(none_exports, {
  NoneBackend: () => NoneBackend
});
var no, NoneBackend;
var init_none = __esm({
  "src/secrets/none.ts"() {
    "use strict";
    init_ui();
    no = () => {
      throw new Error("cs: secrets backend 'none' cannot store secrets");
    };
    NoneBackend = {
      name: "none",
      async init() {
        info(`secrets backend is 'none' \u2014 set [secrets].backend = "sops" in machine.toml to enable`);
      },
      ready: () => true,
      loadEnv: () => ({}),
      writeEnv: no,
      edit: no,
      status: () => info("backend none")
    };
  }
});

// src/secrets/index.ts
import { join as join13 } from "node:path";
async function getBackend(m) {
  if (m.secretsBackend === "sops") return (await Promise.resolve().then(() => (init_sops(), sops_exports))).SopsBackend;
  if (m.secretsBackend === "none") return (await Promise.resolve().then(() => (init_none(), none_exports))).NoneBackend;
  throw new Error(`cs: unknown secrets backend '${m.secretsBackend}' (sops | none)`);
}
function parseDotenv(text3) {
  const out2 = {};
  for (let line of text3.split("\n")) {
    line = line.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    let [k, ...rest] = line.split("=");
    let v = rest.join("=").trim();
    k = k.trim().replace(/^export\s+/, "");
    if (v.length >= 2 && v[0] === '"' && v[v.length - 1] === '"') {
      try {
        v = JSON.parse(v);
      } catch {
        v = v.slice(1, -1);
      }
    } else if (v.length >= 2 && v[0] === "'" && v[v.length - 1] === "'") v = v.slice(1, -1);
    out2[k] = v;
  }
  return out2;
}
var envFile, dumpDotenv;
var init_secrets = __esm({
  "src/secrets/index.ts"() {
    "use strict";
    envFile = (repo, name2) => name2 === "global" ? join13(repo, "secrets", "global.env") : join13(repo, "secrets", "projects", `${name2}.env`);
    dumpDotenv = (v) => Object.entries(v).map(([k, val]) => `${k}=${/[ #"'\\$`]/.test(val) || val === "" ? JSON.stringify(val) : val}`).join("\n") + (Object.keys(v).length ? "\n" : "");
  }
});

// src/secretscmd.ts
var secretscmd_exports = {};
__export(secretscmd_exports, {
  diff: () => diff,
  edit: () => edit,
  enroll: () => enroll,
  environment: () => environment,
  exec: () => exec2,
  get: () => get,
  init: () => init,
  pull: () => pull,
  push: () => push,
  recovery: () => recovery,
  revoke: () => revoke,
  setValues: () => setValues,
  status: () => status,
  unsetValues: () => unsetValues
});
import { chmodSync as chmodSync6, existsSync as existsSync13, mkdirSync as mkdirSync9, readdirSync as readdirSync5, readFileSync as readFileSync12, writeFileSync as writeFileSync9, rmSync as rmSync4 } from "node:fs";
import { join as join14, relative as relative4 } from "node:path";
import { spawnSync as spawnSync6 } from "node:child_process";
async function init(repo, m, interactive = true) {
  await (await getBackend(m)).init(repo, m, interactive);
  return 0;
}
async function status(repo, m) {
  info(bold(`secrets backend: ${m.secretsBackend}`));
  (await getBackend(m)).status(repo, m);
  return 0;
}
async function edit(repo, m, name2) {
  (await getBackend(m)).edit(repo, name2);
  commitSecrets(repo, m, `secrets: edit ${name2}`);
  return 0;
}
async function setValues(repo, m, name2, pairs) {
  const b = await getBackend(m);
  const v = b.loadEnv(repo, name2);
  for (const p of pairs) {
    const i2 = p.indexOf("=");
    if (i2 < 1) throw new Error(`cs: expected KEY=VALUE, got '${p}'`);
    v[p.slice(0, i2).trim()] = p.slice(i2 + 1);
  }
  b.writeEnv(repo, name2, v);
  commitSecrets(repo, m, `secrets: set ${pairs.length} value(s) in ${name2}`);
  ok(`${name2}: ${pairs.map((p) => p.split("=")[0]).join(", ")} stored (encrypted)`);
  return 0;
}
async function unsetValues(repo, m, name2, keys) {
  const b = await getBackend(m);
  const v = b.loadEnv(repo, name2);
  for (const k of keys) delete v[k];
  b.writeEnv(repo, name2, v);
  commitSecrets(repo, m, `secrets: unset ${keys.length} value(s) in ${name2}`);
  return 0;
}
async function get(repo, m, name2, key, show) {
  const v = (await getBackend(m)).loadEnv(repo, name2);
  if (key) {
    if (!(key in v)) return 1;
    console.log(show ? v[key] : mask(v[key]));
    return 0;
  }
  for (const [k, val] of Object.entries(v)) console.log(`${k}=${show ? val : mask(val)}`);
  return 0;
}
async function pull(repo, m, man, project, force) {
  const p = man.projects[project];
  if (!p) throw new Error(`cs: unknown project '${project}'`);
  const v = (await getBackend(m)).loadEnv(repo, project);
  if (!Object.keys(v).length) {
    warn(`no secrets stored for ${project} (cs secrets push ${project} / cs secrets set ${project} K=V)`);
    return 1;
  }
  const root = checkoutRoot(p, workspace(man, m)), target = join14(root, ".env"), text3 = dumpDotenv(v);
  if (existsSync13(target) && readFileSync12(target, "utf8") !== text3 && !force) {
    fail(`${contract(target)} exists and differs \u2014 cs secrets diff ${project}; use --force to overwrite`);
    return 1;
  }
  writeFileSync9(target, text3);
  chmodSync6(target, 384);
  checkIgnored(root, target);
  ok(`wrote ${contract(target)} (${Object.keys(v).length} keys)`);
  return 0;
}
async function push(repo, m, man, project) {
  const p = man.projects[project];
  if (!p) throw new Error(`cs: unknown project '${project}'`);
  const root = checkoutRoot(p, workspace(man, m)), src = join14(root, ".env");
  if (!existsSync13(src)) throw new Error(`cs: ${contract(src)} not found`);
  const v = parseDotenv(readFileSync12(src, "utf8"));
  (await getBackend(m)).writeEnv(repo, project, v);
  commitSecrets(repo, m, `secrets: ${project} .env`);
  checkIgnored(root, src);
  ok(`${project}: ${Object.keys(v).length} keys encrypted into ${contract(envFile(repo, project))}`);
  return 0;
}
async function diff(repo, m, man, project) {
  const p = man.projects[project];
  if (!p) throw new Error(`cs: unknown project '${project}'`);
  const stored = (await getBackend(m)).loadEnv(repo, project);
  const lf = join14(checkoutRoot(p, workspace(man, m)), ".env");
  const local = existsSync13(lf) ? parseDotenv(readFileSync12(lf, "utf8")) : {};
  const rows = [.../* @__PURE__ */ new Set([...Object.keys(stored), ...Object.keys(local)])].sort().filter((k) => stored[k] !== local[k]).map((k) => [k, k in stored ? mask(stored[k]) : dim("-"), k in local ? mask(local[k]) : dim("-")]);
  if (rows.length) {
    table(rows, ["key", "stored", "local .env"]);
    return 1;
  }
  ok("no differences");
  return 0;
}
async function environment(repo, m, man, project, warnMissing = true) {
  const env2 = { ...process.env };
  if (env2.CS_SECRETS_LOADED === "1") return env2;
  const b = await getBackend(m);
  if (b.name !== "none" && !b.ready(repo)) {
    if (warnMissing) warn("secrets not available on this machine (cs secrets init / cs enroll) \u2014 continuing without them");
    return env2;
  }
  Object.assign(env2, b.loadEnv(repo, "global"));
  if (project) Object.assign(env2, b.loadEnv(repo, project));
  env2.CS_SECRETS_LOADED = "1";
  return env2;
}
async function exec2(repo, m, man, project, cmd) {
  if (!cmd.length) throw new Error("cs: secrets exec needs a command after --");
  project ??= projectForPath(man, m, process.cwd())?.name;
  const env2 = await environment(repo, m, man, project);
  const p = spawnSync6(cmd[0], cmd.slice(1), { stdio: "inherit", env: env2 });
  return p.status ?? 1;
}
function enroll(repo, m, machine) {
  const pf = machinePubFile(repo, machine);
  if (!existsSync13(pf)) throw new Error(`cs: ${contract(pf)} not found \u2014 run cs secrets init on ${machine} and cs sync on both sides first`);
  const pub = readFileSync12(pf, "utf8").trim();
  const recs = recipients(repo);
  if (recs.includes(pub)) {
    ok(`${machine} is already a recipient`);
    return 0;
  }
  writeRecipients(repo, [...recs, pub]);
  const n3 = updatekeys(repo);
  git(["add", "-A", ".sops.yaml", "secrets"], repo);
  commit(repo, `secrets: enroll ${machine}`, "cs", `cs@${m.name}`);
  ok(`enrolled ${machine}; re-encrypted ${n3} file(s). Run cs sync here, then cs sync on ${machine}.`);
  return 0;
}
async function revoke(repo, m, machine) {
  const pf = machinePubFile(repo, machine);
  const pub = existsSync13(pf) ? readFileSync12(pf, "utf8").trim() : "";
  const recs = recipients(repo);
  if (pub && recs.includes(pub)) {
    writeRecipients(repo, recs.filter((r2) => r2 !== pub));
    const n3 = updatekeys(repo);
    rmSync4(join14(repo, "machines", machine), { recursive: true, force: true });
    git(["add", "-A", ".sops.yaml", "secrets", "machines"], repo);
    commit(repo, `secrets: revoke ${machine}`, "cs", `cs@${m.name}`);
    ok(`revoked ${machine}; re-encrypted ${n3} file(s)`);
  } else warn(`${machine} was not a recipient`);
  const b = await getBackend(m);
  const keys = /* @__PURE__ */ new Set();
  for (const name2 of ["global", ...Object.keys(man_projects(repo))]) for (const k of Object.keys(b.loadEnv(repo, name2))) keys.add(k);
  if (keys.size) warn("that machine could read these \u2014 rotate them at the source: " + [...keys].sort().join(", "));
  return 0;
}
function man_projects(repo) {
  const d = join14(repo, "secrets", "projects");
  const out2 = {};
  if (existsSync13(d)) {
    for (const f of readdirSync5(d)) if (f.endsWith(".env")) out2[f.slice(0, -4)] = true;
  }
  return out2;
}
function recovery(repo, m) {
  const tmp = join14(home(), ".cache", `cs-recovery-${process.pid}.txt`);
  const exe2 = which("age-keygen") || join14(home(), ".local", "bin", "age-keygen");
  const p = spawnSync6(exe2, ["-o", tmp], { encoding: "utf8" });
  if (p.status !== 0) throw new Error("cs: age-keygen failed");
  const text3 = readFileSync12(tmp, "utf8");
  rmSync4(tmp, { force: true });
  const pub = text3.split("\n").find((l2) => l2.startsWith("# public key:")).split(":")[1].trim();
  const priv = text3.split("\n").find((l2) => l2.startsWith("AGE-SECRET-KEY-"));
  const pf = machinePubFile(repo, "recovery");
  mkdirSync9(join14(repo, "machines", "recovery"), { recursive: true });
  writeFileSync9(pf, pub + "\n");
  writeRecipients(repo, [...recipients(repo), pub]);
  const n3 = updatekeys(repo);
  git(["add", "-A", ".sops.yaml", "secrets", "machines/recovery"], repo);
  commit(repo, "secrets: recovery recipient", "cs", `cs@${m.name}`);
  ok(`recovery recipient added; re-encrypted ${n3} file(s)`);
  note2([priv, "", dim("On a bare machine: write it to ~/.config/sops/age/keys.txt, run cs secrets init, enroll the machine's own key, delete it.")], "Store this in your password manager now \u2014 it is not saved anywhere else");
  return 0;
}
var mask, commitSecrets, checkIgnored;
var init_secretscmd = __esm({
  "src/secretscmd.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_deps();
    init_manifest();
    init_secrets();
    init_sops();
    init_ui();
    mask = (v) => v.length > 8 ? v.slice(0, 3) + "\u2026" + v.slice(-2) : "\u2026";
    commitSecrets = (repo, m, msg) => {
      if (isRepo(repo) && isDirty(repo)) {
        git(["add", "-A", "secrets"], repo);
        commit(repo, msg, "cs", `cs@${m.name}`);
      }
    };
    checkIgnored = (root, f) => {
      if (isRepo(root) && git(["check-ignore", "-q", f], root, { check: false }).code !== 0) warn(`${relative4(root, f)} is NOT gitignored in ${contract(root)} \u2014 add it to .gitignore`);
    };
  }
});

// src/hooks.ts
var hooks_exports = {};
__export(hooks_exports, {
  installHooks: () => installHooks,
  installTimer: () => installTimer,
  runHooks: () => runHooks
});
import { existsSync as existsSync14, mkdirSync as mkdirSync10, readFileSync as readFileSync13, unlinkSync as unlinkSync4, writeFileSync as writeFileSync10 } from "node:fs";
import { join as join15 } from "node:path";
import { spawnSync as spawnSync7 } from "node:child_process";
function installHooks(repo, m, remove = false) {
  const f = join15(repo, "claude", "settings.base.json");
  const data = existsSync14(f) ? loads(readFileSync13(f, "utf8")) : {};
  data.hooks ??= {};
  let changed = false;
  for (const [ev, es] of Object.entries(entries())) {
    const cur = (data.hooks[ev] ?? []).filter((e) => !ours(e));
    const next = remove ? cur : [...cur, ...es];
    if (JSON.stringify(next) !== JSON.stringify(data.hooks[ev] ?? [])) {
      data.hooks[ev] = next;
      changed = true;
    }
    if (!data.hooks[ev]?.length) delete data.hooks[ev];
  }
  if (!Object.keys(data.hooks).length) delete data.hooks;
  if (changed) {
    writeFileSync10(f, dumps(data));
    git(["add", f], repo);
    commit(repo, `claude: ${remove ? "remove" : "install"} cs sync hooks`, "cs", `cs@${m.name}`);
  }
  return changed;
}
function installTimer(remove = false) {
  mkdirSync10(stateDir(), { recursive: true });
  const log2 = join15(stateDir(), "timer.log");
  if (isMac()) {
    const plist = join15(home(), "Library", "LaunchAgents", "dev.claude-share.sync.plist");
    if (remove) {
      spawnSync7("launchctl", ["unload", plist]);
      if (existsSync14(plist)) unlinkSync4(plist);
      return "launchd agent removed";
    }
    mkdirSync10(join15(home(), "Library", "LaunchAgents"), { recursive: true });
    writeFileSync10(plist, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>dev.claude-share.sync</string>
<key>ProgramArguments</key><array><string>/bin/sh</string><string>-lc</string><string>cs sync --quiet</string></array>
<key>StartInterval</key><integer>900</integer>
<key>StandardOutPath</key><string>${log2}</string>
<key>StandardErrorPath</key><string>${log2}</string>
</dict></plist>
`);
    spawnSync7("launchctl", ["unload", plist]);
    const p = spawnSync7("launchctl", ["load", plist], { encoding: "utf8" });
    return "launchd agent every 15 min" + (p.status === 0 ? "" : ` (load failed: ${p.stderr?.trim()})`);
  }
  const d = join15(home(), ".config", "systemd", "user");
  const svc = join15(d, "cs-sync.service"), tmr = join15(d, "cs-sync.timer");
  if (remove) {
    spawnSync7("systemctl", ["--user", "disable", "--now", "cs-sync.timer"]);
    for (const f of [svc, tmr]) if (existsSync14(f)) unlinkSync4(f);
    return "systemd timer removed";
  }
  mkdirSync10(d, { recursive: true });
  writeFileSync10(svc, `[Unit]
Description=claude-share sync

[Service]
Type=oneshot
ExecStart=/bin/sh -lc 'cs sync --quiet'
StandardOutput=append:${log2}
StandardError=append:${log2}
`);
  writeFileSync10(tmr, "[Unit]\nDescription=claude-share sync every 15 min\n\n[Timer]\nOnBootSec=2min\nOnUnitActiveSec=15min\nPersistent=true\n\n[Install]\nWantedBy=timers.target\n");
  const r2 = spawnSync7("systemctl", ["--user", "daemon-reload"], { encoding: "utf8" });
  if (r2.status !== 0) return `systemd --user unavailable (${r2.stderr?.trim()}); timer files written, not enabled`;
  const e = spawnSync7("systemctl", ["--user", "enable", "--now", "cs-sync.timer"], { encoding: "utf8" });
  return "systemd user timer every 15 min" + (e.status === 0 ? "" : ` (enable failed: ${e.stderr?.trim()})`);
}
function runHooks(repo, m, action, timer = true) {
  if (action === "status") {
    const f = join15(repo, "claude", "settings.base.json");
    const data = existsSync14(f) ? loads(readFileSync13(f, "utf8")) : {};
    const have = Object.entries(data.hooks ?? {}).filter(([, es]) => es.some(ours)).map(([ev]) => ev);
    kv("hooks", have.length ? have.join(", ") : dim("not installed"));
    const active = isMac() ? existsSync14(join15(home(), "Library", "LaunchAgents", "dev.claude-share.sync.plist")) : spawnSync7("systemctl", ["--user", "is-active", "cs-sync.timer"], { encoding: "utf8" }).stdout?.trim() === "active";
    kv("timer", active ? green("active") : dim("not active"));
    const last = join15(stateDir(), "last-config");
    kv("last sync", existsSync14(last) ? readFileSync13(last, "utf8").trim() : dim("never"));
    return 0;
  }
  const remove = action === "remove";
  installHooks(repo, m, remove) ? ok(`${remove ? "removed" : "installed"} Claude Code hooks in claude/settings.base.json (run cs apply)`) : skip(`hooks already ${remove ? "absent" : "present"}`);
  if (timer) ok(installTimer(remove));
  return 0;
}
var STOP, START, entries, ours;
var init_hooks = __esm({
  "src/hooks.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_platform();
    init_jsonmerge();
    init_ui();
    STOP = "command -v cs >/dev/null 2>&1 && cs sync --push-only --quiet --debounce 120 || true";
    START = "command -v cs >/dev/null 2>&1 && cs sync --pull-only --quiet --timeout 5 || true";
    entries = () => ({
      Stop: [{ hooks: [{ type: "command", command: STOP, async: true, timeout: 120 }] }],
      SessionStart: [{ matcher: "startup", hooks: [{ type: "command", command: START, timeout: 15 }] }]
    });
    ours = (e) => (e.hooks ?? []).some((h2) => String(h2.command ?? "").includes("cs sync"));
  }
});

// src/projects.ts
var projects_exports = {};
__export(projects_exports, {
  add: () => add2,
  clone: () => clone,
  create: () => create
});
import { existsSync as existsSync15, mkdirSync as mkdirSync11, writeFileSync as writeFileSync11 } from "node:fs";
import { basename as basename2, dirname as dirname7, join as join16, relative as relative5, resolve as resolve5 } from "node:path";
import { spawnSync as spawnSync8 } from "node:child_process";
function add2(repo, m, man, path, o) {
  const ws = workspace(man, m);
  let target = resolve5(path ?? process.cwd());
  let layout = "plain";
  const top = o.kind !== "local" ? toplevel(target) : void 0;
  if (top) {
    target = top;
    if (basename2(top) === "repo" && dirname7(top) !== ws) {
      target = dirname7(top);
      layout = "worktrees";
    }
  }
  const rel = relative5(ws, target);
  if (!rel || rel.startsWith("..") || rel.includes("/")) throw new Error(`cs: project must be a direct child of the workspace ${contract(ws)} (got ${target})`);
  const name2 = o.name ?? rel;
  const checkout = layout === "worktrees" ? join16(target, "repo") : target;
  let kind = o.kind ?? (isRepo(checkout) && remoteUrl(checkout) ? "git" : isRepo(checkout) ? "git" : "synced");
  let url = "", branch = "", identity = o.identity ?? "";
  if (kind === "git") {
    url = remoteUrl(checkout);
    if (!url) throw new Error(`cs: ${checkout} has no origin remote; use --kind synced or push it first`);
    if (url.includes("github")) url = canonicalGithub(url);
    branch = currentBranch(checkout);
    if (!identity) {
      const i2 = identityForUrl(man, url);
      if (!i2) throw new Error(`cs: no identity matches ${url}; pass --identity or add url_globs in projects.toml`);
      identity = i2.id;
    }
  }
  const p = { name: name2, kind, path: rel !== name2 ? rel : void 0, url, identity, profiles: o.profiles.length ? o.profiles : ["all"], machines: [], branch, layout, description: o.description, handoff: {}, sync: {} };
  const errs = validate({ ...man, projects: { [name2]: p } });
  if (errs.length) throw new Error("cs: " + errs.join("; "));
  appendProject(repo, p);
  ok(`registered ${name2} (${kind}${url ? ", " + url : ""}) profiles=${p.profiles.join(",")}`);
  if (!o.noCommit && isRepo(repo)) {
    git(["add", "projects.toml"], repo);
    commit(repo, `projects: add ${name2}`, "cs", `cs@${m.name}`);
  }
  return p;
}
async function clone(repo, m, man, names, dryRun = false) {
  const ws = workspace(man, m);
  let rc = 0;
  const cloned = [];
  for (const p of selectedProjects(man, m)) {
    if (names.length && !names.includes(p.name)) continue;
    const root = checkoutRoot(p, ws), cont = container(p, ws);
    if (existsSync15(root)) {
      if (p.kind === "git" && isRepo(root) && p.url && canonicalGithub(remoteUrl(root)) !== canonicalGithub(p.url)) {
        fail(`${p.name}: exists with a different remote (${remoteUrl(root)}); not touching it`);
        rc = 1;
      }
      continue;
    }
    if (p.kind === "local") {
      info(`${p.name}: local-only, skipped`);
      continue;
    }
    if (p.kind === "synced") {
      if (dryRun) {
        step(`${p.name}: would ${p.url ? "clone" : "create"} ${contract(root)}`);
        continue;
      }
      await spin(`${p.name}\u2026`, async () => {
        if (p.url) git(["clone", "-q", p.url, root]);
        else mkdirSync11(root, { recursive: true });
      });
      step(`${p.name} \u2192 ${contract(root)}`);
      cloned.push(p.name);
      continue;
    }
    if (dryRun) {
      step(`${p.name}: would clone ${p.url} \u2192 ${contract(root)}`);
      continue;
    }
    mkdirSync11(cont, { recursive: true });
    let r2 = await spin(`cloning ${p.name}\u2026`, async () => git(["clone", "-q", ...p.branch ? ["-b", p.branch] : [], p.url, root], void 0, { check: false }));
    let note3 = "";
    if (r2.code !== 0 && p.branch && /Remote branch .* not found/.test(r2.err)) {
      r2 = await spin(`cloning ${p.name} (default branch)\u2026`, async () => git(["clone", "-q", p.url, root], void 0, { check: false }));
      if (r2.code === 0) {
        note3 = yellow(` (branch '${p.branch}' not on remote \u2014 got '${currentBranch(root)}', fix projects.toml)`);
      }
    }
    if (r2.code !== 0) {
      fail(`${p.name}: ${r2.err.split("\n").pop()}`);
      rc = 1;
      continue;
    }
    step(`${p.name} \u2192 ${contract(root)}${p.layout === "worktrees" ? dim(" (worktree layout)") : ""}${note3}`);
    const ident2 = p.identity ? man.identities[p.identity] : void 0;
    const email2 = configGet(root, "user.email");
    if (ident2 && email2 !== ident2.email) {
      warn(`${p.name}: user.email resolved to '${email2 || "UNSET"}' \u2014 setting per-repo identity as fallback`);
      git(["config", "user.name", ident2.name], root);
      git(["config", "user.email", ident2.email], root);
    }
    if (p.postClone) spawnSync8("bash", ["-lc", p.postClone], { cwd: cont, stdio: "inherit" });
    cloned.push(p.name);
  }
  if (cloned.length) {
    const wasQuiet = isQuiet();
    setQuiet(true);
    try {
      runLink(repo, m, man, cloned);
    } finally {
      setQuiet(wasQuiet);
    }
    step(`Claude files linked into ${cloned.length} project(s)`);
  }
  return rc;
}
async function create(repo, m, man, name2, ident2, o) {
  if (!NAME_RE.test(name2)) throw new Error(`cs: '${name2}' is not a valid project name`);
  if (man.projects[name2]) throw new Error(`cs: project '${name2}' is already registered`);
  const ws = workspace(man, m), root = join16(ws, name2), branch = man.defaultBranch, owner2 = ident2.owner, kind = o.kind ?? "git";
  if (kind === "git" && !owner2 && !o.noGithub) throw new Error(`cs: identity '${ident2.id}' has no owner in projects.toml`);
  const url = owner2 ? `git@github.com:${owner2}/${name2}.git` : "";
  intro2(`new project ${bold(name2)}`);
  kv("identity", `${ident2.id}  ${dim(`${ident2.name} <${ident2.email}>`)}`);
  kv("path", contract(root));
  if (kind === "git") {
    kv("remote", url || dim("(none)"));
    kv("branch", branch);
  }
  kv("profiles", o.profiles.join(", "));
  mkdirSync11(root, { recursive: true });
  if (!isRepo(root)) {
    git(["init", "-q", "-b", branch], root);
    step(`git init -b ${branch}`);
  }
  if (kind === "git" && !o.noGithub && url) {
    try {
      const token2 = await ensureToken(owner2);
      const created = await spin(`creating ${owner2}/${name2} on GitHub\u2026`, async () => ensureRepo(owner2, name2, token2, o.priv !== false, o.description ?? ""));
      created ? step(`github: created ${owner2}/${name2}  ${dim(o.priv !== false ? "private" : "public")}`) : skip(`github: ${owner2}/${name2} already exists`);
    } catch (e) {
      fail(e.message);
      if (String(e.message).includes(" 403")) info("fine-grained token needs: Repository access = All repositories, Administration = Read and write (edit the token on GitHub)");
      return 1;
    }
  }
  if (kind === "git" && url) {
    const cur = remoteUrl(root);
    if (!cur) {
      git(["remote", "add", "origin", url], root);
      step(`remote origin  ${dim(url)}`);
    } else if (canonicalGithub(cur) !== canonicalGithub(url)) {
      fail(`${root} already has origin ${cur}`);
      return 1;
    }
  }
  const email2 = configGet(root, "user.email");
  if (email2 !== ident2.email) {
    if (url) warn(`git identity resolved to '${email2 || "UNSET"}' (expected ${ident2.email}); setting it per-repo. Run cs apply to fix globally.`);
    else info(`no remote: git identity set per-repo (${ident2.email})`);
    git(["config", "user.name", ident2.name], root);
    git(["config", "user.email", ident2.email], root);
    git(["config", "core.sshCommand", `ssh -i ${contract(expand(keyPath(ident2)))} -o IdentitiesOnly=yes`], root);
  }
  if (!out(["rev-parse", "--verify", "-q", "HEAD"], root)) {
    if (!existsSync15(join16(root, "README.md"))) writeFileSync11(join16(root, "README.md"), `# ${name2}

${o.description ?? ""}`.trimEnd() + "\n");
    if (!existsSync15(join16(root, ".gitignore"))) writeFileSync11(join16(root, ".gitignore"), ".DS_Store\n*:Zone.Identifier\n.env\n");
    git(["add", "-A"], root);
    commit(root, "init", ident2.name, ident2.email);
    step(`first commit on ${branch}  ${dim(`${ident2.name} <${ident2.email}>`)}`);
  }
  if (kind === "git" && url && !o.noGithub && !aheadBehind(root)) {
    const r2 = await spin("pushing\u2026", async () => git(["push", "-q", "-u", "origin", branch], root, { check: false, timeout: 60 }));
    if (r2.code !== 0) {
      fail(r2.err.split("\n").pop() ?? "push failed");
      return 1;
    }
    step(`pushed ${branch} to ${owner2}/${name2}`);
  }
  const p = { name: name2, kind: kind === "git" && !url ? "local" : kind, url: kind === "git" ? url : "", identity: kind === "git" ? ident2.id : "", profiles: o.profiles, machines: [], branch: kind === "git" ? branch : "", layout: "plain", description: o.description, handoff: {}, sync: {} };
  appendProject(repo, p);
  if (isRepo(repo)) {
    git(["add", "projects.toml"], repo);
    commit(repo, `projects: add ${name2}`, "cs", `cs@${m.name}`);
  }
  step(`registered in projects.toml  ${dim(`${p.kind}, profiles ${o.profiles.join(",")}`)}`);
  setQuiet(true);
  runLink(repo, m, loadManifest(repo), [name2]);
  setQuiet(false);
  step("Claude files linked (memory \u2192 config repo)");
  outro2(bold(`cd ${contract(root)} && claude`));
  return 0;
}
var init_projects = __esm({
  "src/projects.ts"() {
    "use strict";
    init_git();
    init_github();
    init_paths();
    init_manifest();
    init_link();
    init_ui();
    init_paths();
  }
});

// src/init.ts
var init_exports = {};
__export(init_exports, {
  CONFIG_REPO_NAME: () => CONFIG_REPO_NAME,
  PHASES: () => PHASES,
  init: () => init2,
  newConfigRepo: () => newConfigRepo
});
import { copyFileSync as copyFileSync4, existsSync as existsSync16, mkdirSync as mkdirSync12, readdirSync as readdirSync6, writeFileSync as writeFileSync12 } from "node:fs";
import { dirname as dirname8, join as join17, relative as relative6 } from "node:path";
function newConfigRepo(dest, branch = "master") {
  const src = templatesDir() + "/config-repo";
  mkdirSync12(dest, { recursive: true });
  const copy = (d) => {
    for (const e of readdirSync6(d, { withFileTypes: true })) {
      const f = join17(d, e.name), t2 = join17(dest, relative6(src, f));
      if (e.isDirectory()) {
        mkdirSync12(t2, { recursive: true });
        copy(f);
      } else if (!existsSync16(t2)) {
        mkdirSync12(dirname8(t2), { recursive: true });
        copyFileSync4(f, t2);
      }
    }
  };
  copy(src);
  for (const d of ["plans", "projects", "secrets", "claude/skills", "claude/rules", "claude/agents", "machines"]) {
    mkdirSync12(join17(dest, d), { recursive: true });
    if (!readdirSync6(join17(dest, d)).length) writeFileSync12(join17(dest, d, ".gitkeep"), "");
  }
  if (!isRepo(dest)) git(["init", "-q", "-b", branch], dest);
  git(["add", "-A"], dest);
  if (isDirty(dest) || !out(["rev-parse", "--verify", "-q", "HEAD"], dest)) commit(dest, "claude-share config skeleton");
  return dest;
}
async function accessLoop(sshUrl, gh, interactive, machine) {
  const { pub, created } = ensureKey(machine);
  if (created) step(`master key generated  ${dim(KEY)}`);
  let [ok2, err] = await spin("checking access to the config repo\u2026", async () => canAccess(sshUrl));
  let tries = 0;
  while (!ok2) {
    instructions(pub, gh, machine);
    if (!interactive) throw new Error("cs: config repo not reachable with the master key (see instructions above)");
    if (!await proceed("added the key?", "Done \u2014 check access", "Abort") || tries++ >= 10) throw new Error("cs: aborted \u2014 config repo not reachable");
    [ok2, err] = await spin("checking access\u2026", async () => canAccess(sshUrl));
    if (!ok2) warn(`still no access \u2014 ${err}`);
  }
  step("config repo reachable with the master key");
}
async function cloneConfig(sshUrl, target) {
  mkdirSync12(dirname8(target), { recursive: true });
  await spin("cloning the config repo\u2026", async () => git(["clone", "-q", sshUrl, target], void 0, { sshKey: keyPath2() }));
  configureRepo(target);
  step(`config repo cloned to ${dim(contract(target))}`);
}
async function askUrl(prompt) {
  for (; ; ) {
    const raw = await text2(prompt, { placeholder: "https://github.com/<owner>/claude-share-config", validate: (v) => v.trim() ? void 0 : "a URL is required" });
    const [sshUrl, gh] = parseRepoUrl(raw);
    if (gh) {
      const vis = await spin("looking up the repository\u2026", async () => isPublic(httpsUrl(...gh)));
      if (vis === true) step(`${gh[0]}/${gh[1]} found (public)`);
      else if (vis === false) step(`${gh[0]}/${gh[1]} found (private) \u2014 access via the master key`);
      else {
        warn(`${gh[0]}/${gh[1]} not found or unreachable`);
        if (!await confirm2("use this URL anyway?", false)) continue;
      }
    }
    return [sshUrl, gh];
  }
}
async function join_(target, interactive, machine, repoUrl = "") {
  if (existsSync16(target) && isRepo(target)) {
    skip(`config repo already at ${contract(target)}`);
    configureRepo(target);
    return;
  }
  const [sshUrl, gh] = repoUrl ? parseRepoUrl(repoUrl) : await askUrl("config repo URL");
  await accessLoop(sshUrl, gh, interactive, machine);
  await cloneConfig(sshUrl, target);
}
async function create2(target, interactive, machine) {
  const n3 = await text2("name for your new config repo", { default: CONFIG_REPO_NAME, validate: name });
  note2([cyan("https://github.com/new"), dim("no README, no .gitignore, no license \u2014 completely empty")], `Create an empty PRIVATE repository named '${n3}' on GitHub`);
  const [sshUrl, gh] = await askUrl("paste the new repo's URL");
  await accessLoop(sshUrl, gh, interactive, machine);
  newConfigRepo(target);
  if (!remoteUrl(target)) git(["remote", "add", "origin", sshUrl], target);
  configureRepo(target);
  await spin("pushing the initial config repo\u2026", async () => git(["push", "-q", "-u", "origin", currentBranch(target)], target));
  step(`config repo initialized and pushed  ${dim(sshUrl)}`);
}
async function machineName(existingName, interactive) {
  if (machineExists()) return existingName || loadMachine().name;
  if (existingName) return existingName;
  if (!interactive) throw new Error("cs: --name <machine-name> is required");
  const dflt = { wsl2: "desktop", macos: "laptop" }[describe()] ?? "machine";
  return text2("What should this machine be called?", { default: dflt, placeholder: "desktop-work, laptop, \u2026", validate: name });
}
async function machinePhase(repo, nm, profiles, ws, interactive) {
  if (machineExists()) {
    const m2 = loadMachine();
    let changed = false;
    if (nm && m2.name !== nm) {
      m2.name = nm;
      changed = true;
    }
    if (profiles.length && JSON.stringify(m2.profiles) !== JSON.stringify(profiles)) {
      m2.profiles = profiles;
      changed = true;
    }
    if (ws && m2.workspace !== ws) {
      m2.workspace = ws;
      changed = true;
    }
    if (changed) {
      saveMachine(m2);
      step("machine settings updated");
    } else skip(`machine ${m2.name}  ${m2.profiles.join(", ")}`);
    return m2;
  }
  const md = join17(repo, "machines");
  const existing = existsSync16(md) ? readdirSync6(md, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== "recovery").map((d) => d.name).sort() : [];
  if (existing.length) step(`machines already in this share: ${existing.map((x) => bold(x)).join(", ")}`);
  while (existing.includes(nm)) {
    if (!interactive) throw new Error(`cs: machine '${nm}' already exists in the share`);
    if (await confirm2(`'${nm}' already exists \u2014 re-use it (its published keys will be replaced)?`, false)) break;
    nm = await text2("name for this machine", { validate: name });
  }
  let exclude = [];
  if (!profiles.length) {
    let projects = [];
    try {
      projects = Object.values(loadManifest(repo).projects);
    } catch {
    }
    if (interactive && projects.length) {
      const groups = {};
      for (const p of projects) {
        const g = p.profiles.includes("all") ? "every machine" : p.profiles.join(", ");
        (groups[g] ??= []).push({ value: p.name, label: p.name, hint: p.kind === "git" ? `${p.identity} \xB7 ${p.url?.replace(/^git@github\.com:/, "").replace(/\.git$/, "")}` : p.kind });
      }
      const names = new Set(projects.map((p) => p.name));
      let picked = /* @__PURE__ */ new Set();
      let initial = projects.map((p) => p.name);
      for (; ; ) {
        picked = new Set((await groupMultiselect2("Which projects should this machine clone and sync?", groups, initial)).filter((v) => names.has(v)));
        const lines = projects.map((p) => picked.has(p.name) ? green("\u2713 ") + p.name : dim("\u25CB " + p.name + "  (not on this machine)"));
        note2(lines, `${picked.size} of ${projects.length} projects`);
        if (await proceed("proceed with this selection?", "Yes, continue", "Change selection")) break;
        initial = [...picked];
      }
      profiles = [...new Set(projects.filter((p) => picked.has(p.name)).flatMap((p) => p.profiles).filter((x) => x !== "all"))].sort();
      if (!profiles.length) profiles = ["personal"];
      exclude = projects.filter((p) => !picked.has(p.name) && (p.profiles.includes("all") || p.profiles.some((x) => profiles.includes(x)))).map((p) => p.name);
    } else if (interactive) profiles = (await text2("profiles for this machine (comma list \u2014 project groups it should get)", { default: "personal" })).split(",").map((x) => x.trim()).filter(Boolean);
    else profiles = ["personal"];
  }
  let workspaceOverride = ws;
  if (ws === void 0 && interactive) {
    let dws = "~/dev";
    try {
      dws = loadManifest(repo).workspaceRoot;
    } catch {
    }
    const choice = await select2("Where should your projects live on this machine?", [
      { value: "default", label: `${dws}  (recommended)`, hint: existsSync16(expand(dws)) ? "exists" : "will be created" },
      { value: "custom", label: "Somewhere else\u2026", hint: "any absolute path or ~/\u2026" }
    ]);
    let w = dws;
    if (choice === "custom") {
      w = await text2("project root", { default: dws, validate: (v) => v.startsWith("~") || v.startsWith("/") ? void 0 : "use an absolute path or ~/\u2026" });
      if (w.startsWith(home() + "/")) w = "~/" + w.slice(home().length + 1);
      if (isWSL() && expand(w).startsWith("/mnt/")) {
        warn("that is the Windows filesystem \u2014 git and Claude are far slower there; ~/dev inside WSL is recommended");
        if (!await confirm2("use it anyway?", false)) w = dws;
      }
    }
    const existed = existsSync16(expand(w));
    mkdirSync12(expand(w), { recursive: true });
    step(`projects live in ${bold(w)}${existed ? "" : dim("  (created)")}`);
    workspaceOverride = w === dws ? void 0 : w;
  } else if (ws) mkdirSync12(expand(ws), { recursive: true });
  const m = { name: nm, profiles, exclude, workspace: workspaceOverride, secretsBackend: "sops" };
  saveMachine(m);
  return m;
}
async function firstIdentity(repo, m, interactive) {
  const man = loadManifest(repo);
  if (Object.keys(man.identities).length) return;
  if (!interactive) {
    warn("no identities yet \u2014 add one with cs identity add <id> --owner <owner> --name .. --email ..");
    return;
  }
  section("first identity");
  info("an identity = a GitHub owner (your login or an org) + the name and email you commit with there");
  const id = await text2("identity id", { default: "personal", validate: name });
  const own = await text2("GitHub owner (your login or an org)", { validate: owner });
  const nm = await text2("git user.name", { validate: (v) => v ? void 0 : "required" });
  const em = await text2("git user.email", { validate: email });
  await add(repo, m, man, id, { owner: own, name: nm, email: em, noToken: true });
}
async function keysAndTokens(repo, m, interactive, skip2) {
  const full = loadManifest(repo);
  if (!Object.keys(full.identities).length) return;
  const used = new Set(selectedProjects(full, m).map((p) => p.identity).filter(Boolean));
  const man = used.size ? { ...full, identities: Object.fromEntries(Object.entries(full.identities).filter(([id]) => used.has(id))) } : full;
  const skipped = Object.keys(full.identities).filter((id) => !(id in man.identities));
  if (skipped.length) skip(`identities not needed by the selected projects: ${skipped.join(", ")}`);
  if (!skip2.includes("ssh")) {
    section("identity ssh keys");
    const ssh = await Promise.resolve().then(() => (init_ssh(), ssh_exports));
    let rc = await ssh.setup(repo, m, man);
    let tries = 0;
    while (rc !== 0 && interactive && tries++ < 5) {
      if (!await proceed("added the key(s) on GitHub?", "Done \u2014 verify", "Skip for now")) break;
      rc = await ssh.setup(repo, m, man, true);
    }
  }
  if (interactive) {
    const missing = Object.values(man.identities).filter((i2) => i2.owner && !getToken(i2.owner));
    if (missing.length) {
      section("GitHub tokens");
      info("a token per owner lets cs new --<id> create repos \u2014 optional now, cs token set <owner> later");
      for (const i2 of missing) if (await confirm2(`store a token for ${i2.owner} (identity ${i2.id}) now?`, false)) {
        try {
          await ensureToken(i2.owner);
          ok(`token for ${i2.owner} stored`);
        } catch (e) {
          warn(e.message);
        }
      }
    }
  }
}
function push2(repo) {
  if (!remoteUrl(repo)) return;
  const ab = aheadBehind(repo);
  if (ab === void 0 || ab[0]) {
    const r2 = git(["push", "-q", "-u", "origin", currentBranch(repo)], repo, { check: false, timeout: 60 });
    r2.code === 0 ? ok("config repo pushed") : fail(`push failed: ${r2.err}`);
  }
}
async function finish(repo, m, interactive, skip2) {
  const man = loadManifest(repo);
  if (!skip2.includes("apply")) await group("~/.claude applied", () => runApply(repo, m, man), { done: "already up to date" });
  if (!skip2.includes("link")) await group("project files linked", () => runLink(repo, m, man), { done: "already in sync" });
  if (!skip2.includes("secrets") && m.secretsBackend !== "none") await group("secrets", async () => (await Promise.resolve().then(() => (init_secretscmd(), secretscmd_exports))).init(repo, m, interactive));
  if (!skip2.includes("hooks")) await group("automatic sync", async () => {
    (await Promise.resolve().then(() => (init_hooks(), hooks_exports))).runHooks(repo, m, "install");
    runApply(repo, m, loadManifest(repo));
  });
  await group("config repo", () => push2(repo), { done: "nothing to push" });
  let rc = 0;
  if (!skip2.includes("doctor")) rc = await group("doctor", () => runDoctor(repo, m, man, false, true), { done: "all checks passed" });
  const ws = workspace(man, m);
  const missing = selectedProjects(man, m).filter((p) => p.kind !== "local" && !existsSync16(checkoutRoot(p, ws)));
  if (missing.length && interactive && await confirm2(`clone ${missing.length} project(s) now (${missing.slice(0, 6).map((p) => p.name).join(", ")}${missing.length > 6 ? "\u2026" : ""})?`, true)) await group(`clone ${missing.length} project(s)`, async () => (await Promise.resolve().then(() => (init_projects(), projects_exports))).clone(repo, m, man, []));
  outro2(bold("done") + "  " + dim("open a new terminal (claude() wrapper) \xB7 cs status \xB7 cs new <project> --<identity>"));
  return rc;
}
async function init2(o) {
  const skip2 = o.skip ?? [];
  for (const x of skip2) if (!PHASES.includes(x)) throw new Error(`cs: unknown phase '${x}' (phases: ${PHASES.join(", ")})`);
  const interactive = o.interactive ?? (isTTY() || isScripted());
  const target = repoDirDefault();
  const localSrc = o.repo && !/:\/\/|^git@/.test(o.repo) ? expand(o.repo) : void 0;
  intro2("claude-share setup");
  if (!skip2.includes("deps")) await group("prerequisites", () => runDeps(o.installDeps, true));
  const nm = await machineName(o.name ?? "", interactive);
  const already = existsSync16(target) && isRepo(target);
  if (already) {
    skip(`config repo already at ${contract(target)}`);
    if (remoteUrl(target)) configureRepo(target);
  } else if (!skip2.includes("repo")) {
    if (localSrc) {
      if (!(isRepo(localSrc) || isBare(localSrc))) throw new Error(`cs: ${localSrc} is not a git repo`);
      mkdirSync12(dirname8(target), { recursive: true });
      git(["clone", "-q", localSrc, target]);
      ok(`config repo cloned from ${contract(localSrc)}`);
    } else if (o.repo) {
      const [sshUrl, gh] = parseRepoUrl(o.repo);
      if (o.key) {
        mkdirSync12(dirname8(target), { recursive: true });
        git(["clone", "-q", sshUrl, target], void 0, { sshKey: expand(o.key) });
        git(["config", "core.sshCommand", `ssh -i ${contract(expand(o.key))} -o IdentitiesOnly=yes`], target);
      } else {
        await accessLoop(sshUrl, gh, interactive, nm);
        await cloneConfig(sshUrl, target);
      }
    } else if (o.owner) {
      const token2 = await ensureToken(o.owner, interactive);
      const url = `git@github.com:${o.owner}/${CONFIG_REPO_NAME}.git`;
      if (await ensureRepo(o.owner, CONFIG_REPO_NAME, token2, true, "claude-share config (private)")) {
        ok(`created private repo ${o.owner}/${CONFIG_REPO_NAME}`);
        newConfigRepo(target);
        git(["remote", "add", "origin", url], target);
        await accessLoop(url, [o.owner, CONFIG_REPO_NAME], interactive, nm);
        configureRepo(target);
      } else {
        await accessLoop(url, [o.owner, CONFIG_REPO_NAME], interactive, nm);
        await cloneConfig(url, target);
      }
    } else if (interactive) {
      const choice = await select2("What would you like to do?", [{ value: "join", label: "Join an existing share", hint: "you already have a config repo (from another machine)" }, { value: "create", label: "Create a new share", hint: "first machine, no config repo yet" }]);
      if (choice === "create") await create2(target, true, nm);
      else await join_(target, true, nm);
    } else throw new Error("cs: pass --repo <url|path> or --owner <github-owner>, or run cs init in a terminal");
  }
  const m = await machinePhase(target, nm, o.profiles ?? [], o.workspace, interactive);
  await firstIdentity(target, m, interactive);
  await keysAndTokens(target, m, interactive, skip2);
  return finish(target, m, interactive, skip2);
}
var CONFIG_REPO_NAME, PHASES, owner, email, name;
var init_init = __esm({
  "src/init.ts"() {
    "use strict";
    init_git();
    init_github();
    init_master();
    init_paths();
    init_platform();
    init_config();
    init_manifest();
    init_apply();
    init_link();
    init_doctor();
    init_deps();
    init_identity();
    init_ui();
    CONFIG_REPO_NAME = "claude-share-config";
    PHASES = ["deps", "repo", "ssh", "apply", "link", "secrets", "hooks", "doctor"];
    owner = (v) => /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(v) ? void 0 : "a GitHub login, e.g. octocat";
    email = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? void 0 : "not an email address";
    name = (v) => NAME_RE.test(v) ? void 0 : "letters, digits, . _ - only";
  }
});

// src/adopt.ts
var adopt_exports = {};
__export(adopt_exports, {
  adoptMcp: () => adoptMcp,
  adoptMemory: () => adoptMemory,
  adoptProjectFiles: () => adoptProjectFiles,
  candidatePaths: () => candidatePaths,
  claudeProjectKey: () => claudeProjectKey,
  envVarName: () => envVarName,
  runAdopt: () => runAdopt,
  unionLines: () => unionLines
});
import { copyFileSync as copyFileSync5, existsSync as existsSync17, mkdirSync as mkdirSync13, readdirSync as readdirSync7, readFileSync as readFileSync14, writeFileSync as writeFileSync13 } from "node:fs";
import { basename as basename3, dirname as dirname9, extname, join as join18, relative as relative7 } from "node:path";
function candidatePaths(p, ws) {
  const c2 = [container(p, ws), checkoutRoot(p, ws), ...checkouts(p, ws)];
  return [...new Set(c2)];
}
function walkFiles(dir) {
  const out2 = [];
  const rec = (d) => {
    for (const e of readdirSync7(d, { withFileTypes: true })) {
      const f = join18(d, e.name);
      e.isDirectory() ? rec(f) : out2.push(f);
    }
  };
  if (existsSync17(dir)) rec(dir);
  return out2.sort();
}
function adoptMemory(repo, p, ws, machine, check = false) {
  const dest = memoryDir(repo, p);
  let n3 = 0;
  for (const cand of candidatePaths(p, ws)) {
    const src = join18(claudeDir(), "projects", claudeProjectKey(cand), "memory");
    if (!existsSync17(src)) continue;
    info(`${p.name}: adopting memory from ${contract(src)}`);
    for (const f of walkFiles(src)) {
      const rel = relative7(src, f);
      const target = join18(dest, rel);
      if (!existsSync17(target)) {
        step(`+ ${rel}`);
        if (!check) {
          mkdirSync13(dirname9(target), { recursive: true });
          copyFileSync5(f, target);
        }
        n3++;
      } else if (readFileSync14(target).equals(readFileSync14(f))) continue;
      else if (basename3(rel) === "MEMORY.md") {
        step(`~ ${rel} (union)`);
        if (!check) writeFileSync13(target, unionLines(readFileSync14(target, "utf8"), readFileSync14(f, "utf8")));
        n3++;
      } else {
        const alt = join18(dirname9(target), `${basename3(rel, extname(rel))}.from-${machine}-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}${extname(rel)}`);
        step(`? ${rel} differs \u2192 ${basename3(alt)}`);
        if (!check) copyFileSync5(f, alt);
        n3++;
      }
    }
    if (!check) writeFileSync13(join18(dirname9(src), "memory.adopted-by-cs"), `adopted into ${contract(dest)} on ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}
`);
  }
  if (!n3) ok(`${p.name}: no new memory to adopt`);
  return n3;
}
function adoptProjectFiles(repo, p, ws, check = false) {
  const ch = syncProject(repo, p, ws, check);
  for (const c2 of ch) step(`${p.name}: ${c2}`);
  if (!ch.length) ok(`${p.name}: nothing to adopt`);
  return ch.length;
}
function envVarName(server, key) {
  const st = server.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
  let kt = key.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
  if (st.length && kt.length && kt[0] === st[0]) kt = kt.slice(1);
  return [...st, ...kt].join("_");
}
function localScope(p, ws) {
  if (!existsSync17(claudeJson())) return {};
  const data = JSON.parse(readFileSync14(claudeJson(), "utf8"));
  const found = {};
  for (const cand of candidatePaths(p, ws)) for (const [n3, cfg] of Object.entries(data.projects?.[cand]?.mcpServers ?? {})) found[n3] ??= cfg;
  return found;
}
function adoptMcp(repo, p, ws, check = false, show = false) {
  const found = localScope(p, ws);
  if (show) {
    for (const [n3, cfg] of Object.entries(found)) {
      for (const [k, v] of Object.entries(cfg.env ?? {})) console.log(`${envVarName(n3, k)}=${v}`);
      for (const [k, v] of Object.entries(cfg.headers ?? {})) console.log(`${envVarName(n3, k)}=${v}`);
    }
    return Object.keys(found).length;
  }
  if (!Object.keys(found).length) {
    ok(`${p.name}: no local-scope MCP servers in ~/.claude.json`);
    return 0;
  }
  const side = sideStore(repo, p);
  const f = join18(side, ".mcp.json");
  const existing = existsSync17(f) ? loads(readFileSync14(f, "utf8")) : { mcpServers: {} };
  existing.mcpServers ??= {};
  const secrets = {};
  for (const [name2, orig] of Object.entries(found)) {
    const cfg = JSON.parse(JSON.stringify(orig));
    for (const k of Object.keys(cfg.env ?? {})) {
      secrets[envVarName(name2, k)] = cfg.env[k];
      cfg.env[k] = "${" + envVarName(name2, k) + "}";
    }
    for (const k of Object.keys(cfg.headers ?? {})) {
      secrets[envVarName(name2, k)] = cfg.headers[k];
      cfg.headers[k] = "${" + envVarName(name2, k) + "}";
    }
    delete cfg.oauth;
    if (JSON.stringify(existing.mcpServers[name2]) === JSON.stringify(cfg)) continue;
    step(`${p.name}: .mcp.json \u2190 ${name2} (${cfg.type ?? "stdio"})`);
    existing.mcpServers[name2] = cfg;
  }
  if (!check) {
    mkdirSync13(join18(side, ".claude"), { recursive: true });
    writeFileSync13(f, dumps(existing));
    const sl = join18(side, ".claude", "settings.local.json");
    const sd = existsSync17(sl) ? loads(readFileSync14(sl, "utf8")) : {};
    sd.enabledMcpjsonServers = [.../* @__PURE__ */ new Set([...sd.enabledMcpjsonServers ?? [], ...Object.keys(existing.mcpServers)])].sort();
    writeFileSync13(sl, dumps(sd));
  }
  if (Object.keys(secrets).length) {
    warn(`${p.name}: values replaced by \${VAR} placeholders \u2014 store them: cs secrets set global ${Object.keys(secrets).map((k) => `${k}=\u2026`).join(" ")}  (full values: cs adopt mcp ${p.name} --show)`);
  }
  return Object.keys(found).length;
}
function runAdopt(repo, m, man, what, names, check, show) {
  const ws = workspace(man, m);
  if (!names.length) throw new Error("cs: adopt needs a project name (or --all)");
  for (const n3 of names) {
    const p = man.projects[n3];
    if (!p) throw new Error(`cs: unknown project '${n3}'`);
    if (what === "memory") adoptMemory(repo, p, ws, m.name, check);
    else if (what === "project") adoptProjectFiles(repo, p, ws, check);
    else if (what === "mcp") adoptMcp(repo, p, ws, check, show);
    else throw new Error(`cs: unknown adopt target '${what}'`);
  }
}
var claudeProjectKey, unionLines;
var init_adopt = __esm({
  "src/adopt.ts"() {
    "use strict";
    init_paths();
    init_manifest();
    init_link();
    init_jsonmerge();
    init_ui();
    claudeProjectKey = (p) => p.replace(/[^A-Za-z0-9]/g, "-");
    unionLines = (a2, b) => {
      const lines = a2.split("\n").filter((x, i2, arr) => !(i2 === arr.length - 1 && x === ""));
      const seen = new Set(lines);
      for (const l2 of b.split("\n")) if (l2 && !seen.has(l2)) {
        lines.push(l2);
        seen.add(l2);
      }
      return lines.join("\n") + "\n";
    };
  }
});

// src/sync.ts
var sync_exports = {};
__export(sync_exports, {
  gitSync: () => gitSync,
  runSync: () => runSync
});
import { closeSync, existsSync as existsSync18, mkdirSync as mkdirSync14, openSync, readFileSync as readFileSync15, statSync as statSync5, unlinkSync as unlinkSync5, writeFileSync as writeFileSync14 } from "node:fs";
import { join as join19 } from "node:path";
function tryLock(label) {
  mkdirSync14(stateDir(), { recursive: true });
  try {
    return openSync(lockFile(label), "wx");
  } catch {
    try {
      if (Date.now() - statSync5(lockFile(label)).mtimeMs > 10 * 60 * 1e3) {
        unlinkSync5(lockFile(label));
        return openSync(lockFile(label), "wx");
      }
    } catch {
    }
    return void 0;
  }
}
function gitSync(repo, label, machine, o = {}) {
  if (!isRepo(repo)) {
    warn(`${label}: not a git repo (${contract(repo)})`);
    return false;
  }
  const timeout = o.timeout ?? 20;
  if (existsSync18(marker(label)) && !o.resolve) {
    fail(`${label}: sync blocked by an earlier conflict \u2014 ${readFileSync15(marker(label), "utf8").trim()}`);
    return false;
  }
  const fd = tryLock(label);
  if (fd === void 0) {
    info(`${label}: another sync is running, skipping`);
    return true;
  }
  try {
    if (!o.pullOnly && isDirty(repo)) {
      const n3 = dirtyCount(repo);
      git(["add", "-A"], repo);
      commit(repo, `sync(${machine}): ${n3} file(s) ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 16).replace("T", " ")}`, "cs", `cs@${machine}`);
      step(`${label}: committed ${n3} change(s)`);
    }
    if (!remoteUrl(repo)) {
      ok(`${label}: no remote configured; local only`);
      return true;
    }
    const f = git(["fetch", "-q", "--prune", "origin"], repo, { check: false, timeout });
    if (f.code !== 0) {
      warn(`${label}: offline or fetch timed out; will push later`);
      writeFileSync14(join19(stateDir(), `last-${label}`), "offline\n");
      return true;
    }
    const branch = currentBranch(repo);
    if (!branch) {
      fail(`${label}: detached HEAD; refusing to sync`);
      return false;
    }
    if (!out(["rev-parse", "--abbrev-ref", "@{upstream}"], repo)) {
      if (out(["rev-parse", "--verify", "-q", `origin/${branch}`], repo)) git(["branch", "-q", `--set-upstream-to=origin/${branch}`, branch], repo);
      else if (!o.pullOnly) {
        git(["push", "-q", "-u", "origin", branch], repo, { timeout });
        ok(`${label}: pushed new branch ${branch}`);
        return true;
      } else return true;
    }
    let [ahead, behind] = aheadBehind(repo) ?? [0, 0];
    if (behind && !o.pushOnly) {
      if (!ahead) {
        git(["merge", "-q", "--ff-only", "@{upstream}"], repo);
        step(`${label}: fast-forwarded ${behind} commit(s)`);
      } else {
        const args = ["rebase", "-q", ...o.resolve === "ours" ? ["-X", "theirs"] : o.resolve === "theirs" ? ["-X", "ours"] : [], "@{upstream}"];
        const r2 = git(args, repo, { check: false });
        if (r2.code !== 0) {
          const conflicts = out(["diff", "--name-only", "--diff-filter=U"], repo).split("\n").filter(Boolean).join(", ");
          git(["rebase", "--abort"], repo, { check: false });
          writeFileSync14(marker(label), `conflict in: ${conflicts || "unknown"}
`);
          error(`${label}: conflict in ${conflicts}`, "", `keep mine: cs sync --resolve ours \xB7 keep theirs: cs sync --resolve theirs \xB7 manual: cd ${contract(repo)} && git rebase origin/${branch}`);
          return false;
        }
        step(`${label}: rebased ${ahead} local commit(s) onto ${behind} remote commit(s)`);
      }
    }
    if (existsSync18(marker(label))) unlinkSync5(marker(label));
    if (!o.pullOnly) {
      const ab = aheadBehind(repo);
      if (ab && ab[0]) {
        const pr = git(["push", "-q", "origin", branch], repo, { check: false, timeout });
        if (pr.code !== 0) {
          warn(`${label}: push rejected, retrying once`);
          unlock(label, fd);
          return gitSync(repo, label, machine, o);
        }
        ok(`${label}: pushed ${ab[0]} commit(s)`);
      }
    }
    writeFileSync14(join19(stateDir(), `last-${label}`), (/* @__PURE__ */ new Date()).toISOString() + "\n");
    return true;
  } finally {
    try {
      unlock(label, fd);
    } catch {
    }
  }
}
function runSync(repo, m, man, o = {}) {
  const ws = workspace(man, m);
  let rc = 0;
  if (o.debounce) {
    const last = join19(stateDir(), "last-config");
    if (existsSync18(last) && Date.now() - statSync5(last).mtimeMs < o.debounce * 1e3) return 0;
  }
  const before = out(["rev-parse", "HEAD"], repo);
  if (!o.pullOnly) {
    for (const p of selectedProjects(man, m)) if (checkouts(p, ws).length) syncProject(repo, p, ws);
  }
  if (!gitSync(repo, "config", m.name, o)) rc = 2;
  const after = out(["rev-parse", "HEAD"], repo);
  if (after !== before || o.pullOnly) {
    const changed = before ? out(["diff", "--name-only", before, after], repo) : "";
    if (o.pullOnly || changed.split("\n").some((x) => x.startsWith("claude/") || x.startsWith("projects.toml") || x.startsWith("plans/"))) runApply(repo, m, man);
    runLink(repo, m, loadManifest(repo));
  }
  if (o.projects !== false && !o.pullOnly) {
    for (const p of selectedProjects(man, m)) if (p.kind === "synced") {
      const root = checkoutRoot(p, ws);
      if (existsSync18(root) && isRepo(root) && !gitSync(root, p.name, m.name, { timeout: o.timeout })) rc = 2;
    }
  }
  return rc;
}
var marker, lockFile, unlock;
var init_sync = __esm({
  "src/sync.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_manifest();
    init_apply();
    init_link();
    init_ui();
    marker = (label) => join19(stateDir(), `blocked-${label}`);
    lockFile = (label) => join19(stateDir(), `sync-${label}.lock`);
    unlock = (label, fd) => {
      closeSync(fd);
      try {
        unlinkSync5(lockFile(label));
      } catch {
      }
    };
  }
});

// src/status.ts
var status_exports = {};
__export(status_exports, {
  runStatus: () => runStatus
});
import { existsSync as existsSync19, readdirSync as readdirSync8, readFileSync as readFileSync16 } from "node:fs";
import { join as join20 } from "node:path";
function repoState(path, fetch2) {
  if (!isRepo(path)) return ["", dim("not a git repo"), false];
  if (fetch2) git(["fetch", "-q", "--prune"], path, { check: false, timeout: 15 });
  const branch = currentBranch(path) || red("DETACHED");
  const dirty = dirtyCount(path);
  const ab = aheadBehind(path);
  const bits = [];
  let attention = false;
  if (dirty) {
    bits.push(yellow(`${dirty} dirty`));
    attention = true;
  }
  if (ab) {
    if (ab[0]) {
      bits.push(yellow(`\u2191${ab[0]} unpushed`));
      attention = true;
    }
    if (ab[1]) bits.push(cyan(`\u2193${ab[1]} behind`));
  } else if (!branch.includes("DETACHED")) bits.push(dim("no upstream"));
  if (!bits.length) bits.push(green("clean"));
  return [branch, bits.join("  "), attention];
}
function runStatus(repo, m, man, fetch2 = false, showAll = false) {
  const ws = workspace(man, m);
  info(`${bold(m.name)}  ${dim("profiles")} ${m.profiles.join(", ")}  ${dim("workspace")} ${contract(ws)}`);
  const [branch, state] = repoState(repo, fetch2);
  const mk = join20(stateDir(), "blocked-config");
  table([[bold("config repo"), branch, state + (existsSync19(mk) ? "  " + red("BLOCKED: " + readFileSync16(mk, "utf8").trim()) : "")]]);
  let rc = 0;
  const rows = [];
  const known = /* @__PURE__ */ new Set();
  for (const p of Object.values(man.projects)) {
    known.add(p.path || p.name);
    const sel = selected(p, m);
    if (!sel && !showAll) continue;
    const root = checkoutRoot(p, ws);
    const kind = dim(p.kind + (p.layout === "worktrees" ? " \u2442" : ""));
    if (!sel) {
      rows.push([p.name, kind, "", dim("skipped (profile)")]);
      continue;
    }
    if (!existsSync19(root)) {
      rows.push([p.name, kind, "", red("missing") + dim("  cs clone")]);
      rc = 1;
      continue;
    }
    if (p.kind === "git" && isRepo(root)) {
      let [b, s, att] = repoState(root, fetch2);
      const url = remoteUrl(root);
      if (p.url && canonicalGithub(url) !== canonicalGithub(p.url)) {
        s += "  " + red(`remote\u2260manifest (${url})`);
        att = true;
      }
      const ident2 = p.identity ? man.identities[p.identity] : void 0;
      const email2 = configGet(root, "user.email");
      if (ident2 && email2 && email2 !== ident2.email) {
        s += "  " + red(`identity ${email2}`);
        att = true;
      } else if (ident2 && !email2) {
        s += "  " + red("identity unset");
        att = true;
      }
      if (p.layout === "worktrees") s += "  " + dim(`${worktrees(root).length} worktrees`);
      if (att) rc = 1;
      rows.push([p.name, kind, b, s]);
    } else rows.push([p.name, kind, "", green("present")]);
  }
  table(rows, ["project", "kind", "branch", "state"]);
  const unreg = existsSync19(ws) ? readdirSync8(ws, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith(".") && !known.has(d.name)).map((d) => d.name).sort() : [];
  if (unreg.length) warn("unregistered under workspace: " + unreg.join(", ") + dim("   (cs add <path>)"));
  return rc;
}
var init_status = __esm({
  "src/status.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_manifest();
    init_ui();
  }
});

// node_modules/commander/esm.mjs
var import_index = __toESM(require_commander(), 1);
var {
  program,
  createCommand,
  createArgument,
  createOption,
  CommanderError,
  InvalidArgumentError,
  InvalidOptionArgumentError,
  // deprecated old name
  Command,
  Argument,
  Option,
  Help
} = import_index.default;

// src/index.ts
init_ui();
init_platform();
init_config();
init_manifest();
init_paths();
init_git();
import { existsSync as existsSync20, readdirSync as readdirSync9 } from "node:fs";
import { join as join21 } from "node:path";
var pkg = JSON.parse((await import("node:fs")).readFileSync(join21(toolRoot(), "package.json"), "utf8"));
var csv = (s) => s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [];
function ctx() {
  const m = loadMachine();
  const repo = repoDir(m);
  return { repo, m, man: loadManifest(repo) };
}
var program2 = new Command("cs").description("claude-share: projects + Claude Code setup in sync across machines").version(pkg.version, "-V, --version").option("-q, --quiet", "only warnings/errors").configureHelp({ sortSubcommands: false }).showSuggestionAfterError(true).enablePositionalOptions().addHelpText("after", `
examples:
  cs init                                  set this machine up (wizard: join or create a share)
  cs new billing-api --personal            new project: dir, git, GitHub repo, first push, Claude wired in
  cs                                       dashboard: config repo + every project
  cs sync                                  push/pull the config repo (memory, plans, settings)
  cs identity add acme --owner acme-org --name "Me" --email me@acme.com
  cs secrets set global API_TOKEN=\u2026        encrypted, available to Claude's MCP servers as \${API_TOKEN}`);
program2.hook("preAction", (_root, cmd) => setQuiet(Boolean(program2.opts().quiet || cmd.opts().quiet)));
program2.command("init").description("set this machine up (wizard) \u2014 or --repo <url> / --owner <owner> for scripts").option("--repo <url>", "existing config repo: git URL or local path").option("--owner <owner>", "GitHub user/org to create claude-share-config under").option("--key <path>", "ssh key for cloning --repo (instead of the master key)").option("--non-interactive").option("--name <name>", "machine name").option("--profiles <list>", "comma list").option("--workspace <path>").option("--skip <phases>", "comma list: deps,repo,ssh,apply,link,secrets,hooks,doctor").option("--install-deps").action(async (o) => {
  const { init: init3 } = await Promise.resolve().then(() => (init_init(), init_exports));
  process.exitCode = await init3({ repo: o.repo, owner: o.owner, key: o.key, name: o.name, profiles: csv(o.profiles), workspace: o.workspace, skip: csv(o.skip), installDeps: o.installDeps, interactive: !o.nonInteractive && (isTTY() || isScripted()) });
});
var config = program2.command("config").description("manage the config repo");
config.command("new <path>").description("create a config repo skeleton").action(async (p) => {
  const { newConfigRepo: newConfigRepo2 } = await Promise.resolve().then(() => (init_init(), init_exports));
  const { expand: expand2, contract: contract3 } = await Promise.resolve().then(() => (init_paths(), paths_exports));
  const d = newConfigRepo2(expand2(p));
  ok(`config repo created at ${contract3(d)} \u2014 edit projects.toml, then cs init --repo ${contract3(d)}`);
});
config.command("path").description("print the config repo path").action(() => console.log(repoDir(loadMachine())));
program2.command("apply").description("render ~/.claude + git identity includes from the config repo").option("--check", "report drift, change nothing").action(async (o) => {
  const { repo, m, man } = ctx();
  const { runApply: runApply2 } = await Promise.resolve().then(() => (init_apply(), apply_exports));
  process.exitCode = o.check && runApply2(repo, m, man, true).length ? 1 : 0;
});
program2.command("link [names...]").description("sync Claude files between side-store and project checkouts").option("--check").action(async (names, o) => {
  const { repo, m, man } = ctx();
  const { runLink: runLink2 } = await Promise.resolve().then(() => (init_link(), link_exports));
  process.exitCode = o.check && runLink2(repo, m, man, names, true) ? 1 : 0;
});
program2.command("adopt <what> [names...]").description("pull existing local state into the config repo (memory | project | mcp)").option("--all").option("--check").option("--show", "(mcp) print the secret values").action(async (what, names, o) => {
  const { repo, m, man } = ctx();
  const { runAdopt: runAdopt2 } = await Promise.resolve().then(() => (init_adopt(), adopt_exports));
  const { selectedProjects: selectedProjects2 } = await Promise.resolve().then(() => (init_manifest(), manifest_exports));
  runAdopt2(repo, m, man, what, names.length ? names : o.all ? selectedProjects2(man, m).map((p) => p.name) : [], o.check, o.show);
});
program2.command("sync").description("commit / pull --rebase / push the config repo (+ synced projects)").option("--pull-only").option("--push-only").option("--timeout <s>", "", "20").option("--resolve <ours|theirs>").option("--no-projects").option("--debounce <s>", "skip if a sync ran less than N seconds ago", "0").option("-q, --quiet").action(async (o) => {
  const { repo, m, man } = ctx();
  const { runSync: runSync2 } = await Promise.resolve().then(() => (init_sync(), sync_exports));
  process.exitCode = runSync2(repo, m, man, { pullOnly: o.pullOnly, pushOnly: o.pushOnly, timeout: +o.timeout, resolve: o.resolve, projects: o.projects, debounce: +o.debounce });
});
program2.command("status").description("config repo + projects overview").option("--fetch").option("--all").action(async (o) => {
  const { repo, m, man } = ctx();
  const { runStatus: runStatus2 } = await Promise.resolve().then(() => (init_status(), status_exports));
  process.exitCode = runStatus2(repo, m, man, o.fetch, o.all);
});
program2.command("doctor").description("environment and consistency checks").option("--fix").action(async (o) => {
  const { repo, m, man } = ctx();
  const { runDoctor: runDoctor2 } = await Promise.resolve().then(() => (init_doctor(), doctor_exports));
  process.exitCode = runDoctor2(repo, m, man, o.fix);
});
program2.command("add [path]").description("register a project (default: cwd) in projects.toml").option("--kind <kind>").option("--profiles <list>").option("--identity <id>").option("--name <name>").option("--description <text>", "", "").option("--no-commit").action(async (p, o) => {
  const { repo, m, man } = ctx();
  const { add: add3 } = await Promise.resolve().then(() => (init_projects(), projects_exports));
  add3(repo, m, man, p, { kind: o.kind, profiles: csv(o.profiles), identity: o.identity, name: o.name, description: o.description, noCommit: !o.commit });
});
program2.command("clone [names...]").description("clone selected projects that are missing on this machine").option("--dry-run").action(async (names, o) => {
  const { repo, m, man } = ctx();
  const { clone: clone2 } = await Promise.resolve().then(() => (init_projects(), projects_exports));
  process.exitCode = await clone2(repo, m, man, names, o.dryRun);
});
program2.command("new <name>").description("create a brand-new project: dir, git, GitHub repo, first push, register, link").option("--identity <id>", "identity id (or --<id> / --<github-owner>, e.g. --personal)").option("--profiles <list>").option("-d, --description <text>", "", "").option("--public").option("--no-github").option("--synced").action(async (name2, o) => {
  const { repo, m, man } = ctx();
  let id = o.identity;
  if (!id) throw new Error(`cs: which identity? use one of ${Object.keys(man.identities).map((i2) => "--" + i2).join(", ")} (or --identity <id>)`);
  const ident2 = man.identities[id] ?? identityByFlag(man, id);
  if (!ident2) throw new Error(`cs: unknown identity '${id}'`);
  const profiles = csv(o.profiles).length ? csv(o.profiles) : m.profiles.includes(ident2.id) ? [ident2.id] : [...m.profiles];
  const { create: create3 } = await Promise.resolve().then(() => (init_projects(), projects_exports));
  process.exitCode = await create3(repo, m, man, name2, ident2, { profiles, description: o.description, priv: !o.public, noGithub: !o.github, kind: o.synced ? "synced" : "git" });
});
var token = program2.command("token").description("GitHub API tokens per owner (local, never synced)");
token.command("set <owner>").action(async (o) => {
  const gh = await Promise.resolve().then(() => (init_github(), github_exports));
  const f = await gh.setToken(o);
  ok(`token stored in ${(await Promise.resolve().then(() => (init_paths(), paths_exports))).contract(f)} (0600, not synced)`);
});
token.command("check <owner>").action(async (o) => {
  const gh = await Promise.resolve().then(() => (init_github(), github_exports));
  const t2 = gh.getToken(o);
  if (!t2) {
    fail(`no token for '${o}'`);
    process.exitCode = 1;
    return;
  }
  try {
    ok(`token for '${o}' authenticates as ${await gh.whoami(t2)}`);
  } catch (e) {
    fail(e.message);
    process.exitCode = 1;
  }
});
token.command("rm <owner>").action(async (o) => {
  (await Promise.resolve().then(() => (init_github(), github_exports))).rmToken(o);
  ok("removed");
});
token.command("ls").action(() => {
  const d = join21(csConfigDir(), "tokens");
  if (existsSync20(d)) for (const f of readdirSync9(d)) console.log(f);
});
var ident = program2.command("identity").description("git identities (who commits, which key, which GitHub owner)");
ident.command("ls", { isDefault: true }).description("list identities").action(async () => {
  const { man } = ctx();
  (await Promise.resolve().then(() => (init_identity(), identity_exports))).ls(man);
});
ident.command("add <id>").requiredOption("--owner <owner>", "GitHub user or org").requiredOption("--name <name>").requiredOption("--email <email>").option("--key <path>").option("--no-token").action(async (id, o) => {
  const { repo, m, man } = ctx();
  process.exitCode = await (await Promise.resolve().then(() => (init_identity(), identity_exports))).add(repo, m, man, id, { owner: o.owner, name: o.name, email: o.email, key: o.key, noToken: !o.token });
});
ident.command("rename <old> <new>").action(async (a2, b) => {
  const { repo, m, man } = ctx();
  process.exitCode = (await Promise.resolve().then(() => (init_identity(), identity_exports))).rename(repo, m, man, a2, b);
});
program2.command("ssh [action]").description("per-machine SSH keys: setup | check | master").action(async (action = "check") => {
  const { repo, m, man } = ctx();
  if (action === "master") {
    process.exitCode = await (await Promise.resolve().then(() => (init_master(), master_exports))).setup(repo, isTTY());
    return;
  }
  process.exitCode = await (await Promise.resolve().then(() => (init_ssh(), ssh_exports))).setup(repo, m, man, action === "check");
});
program2.command("deps").description("check (or install) prerequisites").option("--install").action(async (o) => {
  process.exitCode = await (await Promise.resolve().then(() => (init_deps(), deps_exports))).runDeps(o.install);
});
program2.command("hooks [action]").description("automatic sync: install | remove | status").option("--no-timer").action(async (action = "status", o) => {
  const { repo, m } = ctx();
  process.exitCode = (await Promise.resolve().then(() => (init_hooks(), hooks_exports))).runHooks(repo, m, action, o.timer);
});
program2.command("self-update").description("git pull the cs tool itself").action(() => {
  const root = toolRoot();
  if (!isRepo(root)) {
    fail(`${root} is not a git checkout`);
    process.exitCode = 1;
    return;
  }
  const before = out(["rev-parse", "--short", "HEAD"], root);
  const r2 = git(["pull", "-q", "--ff-only"], root, { check: false, timeout: 60 });
  if (r2.code !== 0) {
    fail(`pull failed: ${r2.err}`);
    process.exitCode = 1;
    return;
  }
  const after = out(["rev-parse", "--short", "HEAD"], root);
  ok(`cs at ${after}${before === after ? "" : ` (was ${before})`}`);
});
var sec = program2.command("secrets").description("encrypted secrets in the config repo (sops + age)").enablePositionalOptions();
var S = () => Promise.resolve().then(() => (init_secretscmd(), secretscmd_exports));
sec.command("init").action(async () => {
  const { repo, m } = ctx();
  await (await S()).init(repo, m, isTTY());
});
sec.command("status").action(async () => {
  const { repo, m } = ctx();
  await (await S()).status(repo, m);
});
sec.command("edit <name>").description("global | <project>").action(async (n3) => {
  const { repo, m } = ctx();
  await (await S()).edit(repo, m, n3);
});
sec.command("set <name> <pairs...>").description("KEY=VALUE \u2026").action(async (n3, pairs) => {
  const { repo, m } = ctx();
  await (await S()).setValues(repo, m, n3, pairs);
});
sec.command("unset <name> <keys...>").action(async (n3, keys) => {
  const { repo, m } = ctx();
  await (await S()).unsetValues(repo, m, n3, keys);
});
sec.command("get <name> [key]").option("--show").action(async (n3, k, o) => {
  const { repo, m } = ctx();
  process.exitCode = await (await S()).get(repo, m, n3, k, o.show);
});
sec.command("pull <project>").option("--force").action(async (p, o) => {
  const { repo, m, man } = ctx();
  process.exitCode = await (await S()).pull(repo, m, man, p, o.force);
});
sec.command("push <project>").action(async (p) => {
  const { repo, m, man } = ctx();
  process.exitCode = await (await S()).push(repo, m, man, p);
});
sec.command("diff <project>").action(async (p) => {
  const { repo, m, man } = ctx();
  process.exitCode = await (await S()).diff(repo, m, man, p);
});
sec.command("exec [command...]").description("run a command with global + project secrets in its environment").option("-p, --project <name>").passThroughOptions().allowUnknownOption().action(async (command, o) => {
  const { repo, m, man } = ctx();
  const cmd = command[0] === "--" ? command.slice(1) : command;
  process.exitCode = await (await S()).exec(repo, m, man, o.project, cmd);
});
sec.command("recovery").action(async () => {
  const { repo, m } = ctx();
  (await S()).recovery(repo, m);
});
program2.command("enroll <machine>").description("grant another machine access to secrets").action(async (mc) => {
  const { repo, m } = ctx();
  (await S()).enroll(repo, m, mc);
});
program2.command("revoke <machine>").description("remove a machine's access to secrets").action(async (mc) => {
  const { repo, m } = ctx();
  await (await S()).revoke(repo, m, mc);
});
var proj = program2.command("project").description("project helpers");
proj.command("id").description("print the project name for the cwd").action(() => {
  const { m, man } = ctx();
  const p = projectForPath(man, m, process.cwd());
  if (p) console.log(p.name);
  else process.exitCode = 1;
});
async function main() {
  refuseUnsupported();
  process.stdout.on("error", (e) => {
    if (e?.code === "EPIPE") process.exit(0);
    throw e;
  });
  const argv = process.argv.slice(2);
  if (argv[0] === "new" && machineExists()) {
    try {
      const { man } = ctx();
      for (let i2 = 1; i2 < argv.length; i2++) {
        const a2 = argv[i2];
        if (a2.startsWith("--") && !a2.includes("=")) {
          const hit = identityByFlag(man, a2.slice(2));
          if (hit) argv.splice(i2, 1, "--identity", hit.id);
        }
      }
      process.argv = [...process.argv.slice(0, 2), ...argv];
    } catch {
    }
  }
  if (!argv.length) {
    if (machineExists()) {
      const { repo, m, man } = ctx();
      const { runStatus: runStatus2 } = await Promise.resolve().then(() => (init_status(), status_exports));
      runStatus2(repo, m, man);
      console.log(dim("\ncs --help for commands"));
      return;
    }
    program2.help();
  }
  try {
    await program2.parseAsync(process.argv);
  } catch (e) {
    const msg = e?.message ?? String(e);
    if (msg.startsWith("cs: ")) {
      const [what, ...rest] = msg.slice(4).split("\n");
      error(what, rest.join("\n").trim());
      process.exitCode = 1;
    } else throw e;
  }
}
main();
/*! Bundled license information:

smol-toml/dist/date.js:
smol-toml/dist/error.js:
smol-toml/dist/util.js:
smol-toml/dist/primitive.js:
smol-toml/dist/extract.js:
smol-toml/dist/struct.js:
smol-toml/dist/parse.js:
smol-toml/dist/stringify.js:
smol-toml/dist/index.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)
*/
