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
        return helper.visibleCommands(cmd).reduce((max, command2) => {
          return Math.max(
            max,
            this.displayWidth(
              helper.styleSubcommandTerm(helper.subcommandTerm(command2))
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
        for (let command2 = this; command2; command2 = command2.parent) {
          result.push(command2);
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
      _registerCommand(command2) {
        const knownBy = (cmd) => {
          return [cmd.name()].concat(cmd.aliases());
        };
        const alreadyUsed = knownBy(command2).find(
          (name2) => this._findCommand(name2)
        );
        if (alreadyUsed) {
          const existingCmd = knownBy(this._findCommand(alreadyUsed)).join("|");
          const newCmd = knownBy(command2).join("|");
          throw new Error(
            `cannot add command '${newCmd}' as already have command '${existingCmd}'`
          );
        }
        this.commands.push(command2);
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
      _optionEx(config, flags, description, fn, defaultValue) {
        if (typeof flags === "object" && flags instanceof Option2) {
          throw new Error(
            "To add an Option object use addOption() instead of option() or requiredOption()"
          );
        }
        const option = this.createOption(flags, description);
        option.makeOptionMandatory(!!config.mandatory);
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
        const config = errorOptions || {};
        const exitCode = config.exitCode || 1;
        const code = config.code || "commander.error";
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
          let command2 = this;
          do {
            const moreFlags = command2.createHelp().visibleOptions(command2).filter((option) => option.long).map((option) => option.long);
            candidateFlags = candidateFlags.concat(moreFlags);
            command2 = command2.parent;
          } while (command2 && !command2._enablePositionalOptions);
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
          this.createHelp().visibleCommands(this).forEach((command2) => {
            candidateNames.push(command2.name());
            if (command2.alias()) candidateNames.push(command2.alias());
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
        let command2 = this;
        if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
          command2 = this.commands[this.commands.length - 1];
        }
        if (alias === command2._name)
          throw new Error("Command alias can't be the same as its name");
        const matchingCommand = this.parent?._findCommand(alias);
        if (matchingCommand) {
          const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join("|");
          throw new Error(
            `cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`
          );
        }
        command2._aliases.push(alias);
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
        this._getCommandAndAncestors().reverse().forEach((command2) => command2.emit("beforeAllHelp", eventContext));
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
          (command2) => command2.emit("afterAllHelp", eventContext)
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
      up: (count2 = 1) => `${CSI2}${count2}A`,
      down: (count2 = 1) => `${CSI2}${count2}B`,
      forward: (count2 = 1) => `${CSI2}${count2}C`,
      backward: (count2 = 1) => `${CSI2}${count2}D`,
      nextLine: (count2 = 1) => `${CSI2}E`.repeat(count2),
      prevLine: (count2 = 1) => `${CSI2}F`.repeat(count2),
      left: `${CSI2}G`,
      hide: `${CSI2}?25l`,
      show: `${CSI2}?25h`,
      save: `${ESC2}7`,
      restore: `${ESC2}8`
    };
    var scroll = {
      up: (count2 = 1) => `${CSI2}S`.repeat(count2),
      down: (count2 = 1) => `${CSI2}T`.repeat(count2)
    };
    var erase3 = {
      screen: `${CSI2}2J`,
      up: (count2 = 1) => `${CSI2}1J`.repeat(count2),
      down: (count2 = 1) => `${CSI2}J`.repeat(count2),
      line: `${CSI2}2K`,
      lineEnd: `${CSI2}K`,
      lineStart: `${CSI2}1K`,
      lines(count2) {
        let clear = "";
        for (let i2 = 0; i2 < count2; i2++)
          clear += this.line + (i2 < count2 - 1 ? cursor3.up() : "");
        if (count2)
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
      }, H2 = () => {
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
`)), H2(), M();
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
    var formatter = (open2, close, replace = open2) => (input) => {
      let string = "" + input, index = string.indexOf(close, open2.length);
      return ~index ? open2 + replaceClose(string, close, replace, index) + close : open2 + string + close;
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
    var createColors = (enabled2 = isColorSupported) => {
      let f = enabled2 ? formatter : () => String;
      return {
        isColorSupported: enabled2,
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
  if (quiet) return;
  if (collecting) {
    if (msg) collecting.push(msg);
    return;
  }
  log.message(msg);
}
function ok(msg) {
  if (quiet) return;
  if (collecting) {
    collecting.push(msg);
    return;
  }
  log.success(msg);
}
function step(msg) {
  if (quiet) return;
  if (collecting) {
    collecting.push(msg);
    return;
  }
  log.step(msg);
}
function steps(lines) {
  for (const l2 of lines) step(l2);
}
function skip(msg) {
  if (quiet || collecting) return;
  log.message(import_picocolors.default.dim("\u25CB " + msg));
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
  if (quiet || !rows.length) return;
  if (collecting) {
    for (const r2 of rows) collecting.push(r2.join("  "));
    return;
  }
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
  if (scripted) throw new Error(`cs: scripted answers exhausted at prompt '${q.trim()}'`);
  const rl = createInterface2({ input: process.stdin, output: process.stdout });
  return new Promise((res) => {
    let done = false;
    rl.on("close", () => {
      if (!done) {
        done = true;
        res("");
      }
    });
    rl.question(q, (a2) => {
      done = true;
      rl.close();
      res(a2.trim());
    });
  });
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
async function command(title, fn, opts = {}) {
  intro2(title);
  try {
    const r2 = await fn();
    outro2(opts.outro ? opts.outro(r2) : import_picocolors.default.dim("done"));
    return r2;
  } catch (e) {
    const msg = e?.message ?? String(e);
    const [what, ...rest] = (msg.startsWith("cs: ") ? msg.slice(4) : msg).split("\n");
    error(what, rest.join("\n").trim());
    outro(import_picocolors.default.red("failed"));
    throw Object.assign(new Error("__handled__"), { handled: true, code: 1 });
  }
}
var import_picocolors, quiet, collecting, setQuiet, strip, isTTY, scripted, isScripted, canAsk, dim, bold, green, yellow, red, cyan, gray, magenta, activeSpinner, width, clip;
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
    isTTY = () => Boolean(process.stdin.isTTY && process.stdout.isTTY);
    scripted = process.env.CS_ANSWERS ? JSON.parse(process.env.CS_ANSWERS) : null;
    isScripted = () => scripted !== null;
    canAsk = () => isTTY() || Boolean(scripted && scripted.length);
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
  handoffStateDir: () => handoffStateDir,
  home: () => home,
  isUnder: () => isUnder,
  legacyShareDir: () => legacyShareDir,
  legacyShareKey: () => legacyShareKey,
  machineFile: () => machineFile,
  nodename: () => nodename,
  shareDirDefault: () => shareDirDefault,
  shareKeyDefault: () => shareKeyDefault,
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
var home, claudeDir, claudeJson, csConfigDir, machineFile, shareDirDefault, shareKeyDefault, legacyShareDir, legacyShareKey, handoffStateDir, stateDir, toolRoot, templatesDir, nodename, isUnder;
var init_paths = __esm({
  "src/paths.ts"() {
    "use strict";
    home = () => process.env.HOME || homedir();
    claudeDir = () => process.env.CLAUDE_CONFIG_DIR || join(home(), ".claude");
    claudeJson = () => join(process.env.CLAUDE_CONFIG_DIR || home(), ".claude.json");
    csConfigDir = () => process.env.CS_CONFIG_DIR || join(home(), ".config", "claude-share");
    machineFile = () => join(csConfigDir(), "machine.toml");
    shareDirDefault = () => join(csConfigDir(), "share");
    shareKeyDefault = () => join(home(), ".ssh", "cs", "share");
    legacyShareDir = () => join(csConfigDir(), "repo");
    legacyShareKey = () => join(home(), ".ssh", "cs", "master");
    handoffStateDir = () => join(stateDir(), "handoff");
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
function skipComment(ctx) {
  for (; ctx.p < ctx.s.length; ctx.p++) {
    let c2 = ctx.s.charCodeAt(ctx.p);
    if (c2 === 10)
      break;
    if (c2 === 13 && ctx.s.charCodeAt(ctx.p + 1) === 10) {
      ctx.p++;
      break;
    }
    if (c2 < 32 && c2 !== 9 || c2 === 127) {
      throw new TomlError("control characters are not allowed in comments", {
        toml: ctx.s,
        ptr: ctx.p
      });
    }
  }
}
function skipVoid(ctx, banNewLines, banComments) {
  let c2;
  while (1) {
    while ((c2 = ctx.s.charCodeAt(ctx.p)) === 32 || c2 === 9 || !banNewLines && (c2 === 10 || c2 === 13 && ctx.s.charCodeAt(ctx.p + 1) === 10))
      ctx.p++;
    if (banComments || c2 !== 35)
      break;
    skipComment(ctx);
  }
}
function skipUntil(ctx, sep, end) {
  let ptr = ctx.p;
  if (!end) {
    ptr = indexOfNewline(ctx.s, ptr);
    ctx.p = ptr < 0 ? ctx.s.length : ptr;
    return;
  }
  for (; ctx.p < ctx.s.length; ctx.p++) {
    let c2 = ctx.s.charCodeAt(ctx.p);
    if (c2 === 35) {
      skipComment(ctx);
    } else if (c2 === end || c2 === sep) {
      return;
    }
  }
  throw new TomlError("cannot find end of structure", {
    toml: ctx.s,
    ptr
  });
}
var init_util = __esm({
  "node_modules/smol-toml/dist/util.js"() {
    init_error();
  }
});

// node_modules/smol-toml/dist/primitive.js
function parseString(ctx) {
  let start = ctx.p;
  let c2 = ctx.s.charCodeAt(ctx.p++);
  let first = c2;
  let isLiteral = c2 === 39;
  let isMultiline = c2 === ctx.s.charCodeAt(ctx.p) && c2 === ctx.s.charCodeAt(ctx.p + 1);
  if (isMultiline) {
    if ((c2 = ctx.s.charCodeAt(ctx.p += 2)) === 10)
      ctx.p++;
    else if (c2 === 13 && ctx.s.charCodeAt(ctx.p + 1) === 10)
      ctx.p += 2;
  }
  let parsed = "";
  let sliceStart = ctx.p;
  let state = 0;
  for (; ctx.p < ctx.s.length; ctx.p++) {
    c2 = ctx.s.charCodeAt(ctx.p);
    if (isMultiline && (c2 === 10 || c2 === 13 && ctx.s.charCodeAt(ctx.p + 1) === 10)) {
      state = state && 3;
    } else if (c2 < 32 && c2 !== 9 || c2 === 127) {
      throw new TomlError("control characters are not allowed in strings", {
        toml: ctx.s,
        ptr: ctx.p
      });
    } else if ((!state || state === 3) && c2 === first && (!isMultiline || ctx.s.charCodeAt(ctx.p + 1) === first && ctx.s.charCodeAt(ctx.p + 2) === first)) {
      if (isMultiline) {
        if (ctx.s.charCodeAt(ctx.p + 3) === first)
          ctx.p++;
        if (ctx.s.charCodeAt(ctx.p + 3) === first)
          ctx.p++;
      }
      if (!state)
        parsed += ctx.s.slice(sliceStart, ctx.p);
      ctx.p += isMultiline ? 3 : 1;
      return parsed;
    } else if (!state) {
      if (!isLiteral && c2 === 92) {
        parsed += ctx.s.slice(sliceStart, sliceStart = ctx.p);
        state = 1;
      }
    } else if (state === 1) {
      if (c2 === 120 || c2 === 117 || c2 === 85) {
        let value = 0;
        let len = c2 === 120 ? 2 : c2 === 117 ? 4 : 8;
        for (let j = 0; j < len; j++, ctx.p++) {
          let hex = ctx.s.charCodeAt(ctx.p + 1);
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
            throw new TomlError("invalid non-hex character in unicode escape", { toml: ctx.s, ptr: ctx.p + 1 });
          value = value << 4 | digit;
        }
        if (value < 0 || value > 1114111 || value >= 55296 && value <= 57343) {
          throw new TomlError("invalid unicode escape", { toml: ctx.s, ptr: ctx.p });
        }
        parsed += String.fromCodePoint(value);
        sliceStart = ctx.p + 1;
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
          throw new TomlError("unrecognized escape sequence", { toml: ctx.s, ptr: ctx.p });
        sliceStart = ctx.p + 1;
        state = 0;
      }
    } else if (c2 !== 32 && c2 !== 9) {
      if (state === 2) {
        throw new TomlError("invalid escape: only line-ending whitespace may be escaped", {
          toml: ctx.s,
          ptr: sliceStart
        });
      }
      state = !isLiteral && c2 === 92 ? 1 : 0;
      sliceStart = ctx.p;
    }
  }
  throw new TomlError("unfinished string", { toml: ctx.s, ptr: start });
}
function sliceAndTrimEndOf(ctx, start, end) {
  let value = ctx.s.slice(start, end);
  let commentIdx = value.indexOf("#");
  if (commentIdx > 0) {
    skipComment({ s: value, p: commentIdx, d: 0 });
    value = value.slice(0, commentIdx);
  }
  return value.trimEnd();
}
function parseValue(ctx, integersAsBigInt, end) {
  let ptr = ctx.p;
  let err = { toml: ctx.s, ptr };
  skipUntil(ctx, 44, end);
  let value = sliceAndTrimEndOf(ctx, ptr, ctx.p);
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
function extractValue(ctx, end, integersAsBigInt) {
  let ptr = ctx.p;
  let c2 = ctx.s.charCodeAt(ptr);
  if (c2 === 91 || c2 === 123) {
    if (!ctx.d--) {
      throw new TomlError("document contains excessively nested structures. aborting.", {
        toml: ctx.s,
        ptr
      });
    }
    let value = c2 === 91 ? parseArray(ctx, integersAsBigInt) : parseInlineTable(ctx, integersAsBigInt);
    ctx.d++;
    return value;
  }
  if (c2 === 34 || c2 === 39) {
    return parseString(ctx);
  }
  if (c2 === 116) {
    if (ctx.s.charCodeAt(++ctx.p) !== 114 || ctx.s.charCodeAt(++ctx.p) !== 117 || ctx.s.charCodeAt(++ctx.p) !== 101)
      throw new TomlError("invalid value", { toml: ctx.s, ptr });
    ctx.p++;
    return true;
  }
  if (c2 === 102) {
    if (ctx.s.charCodeAt(++ctx.p) !== 97 || ctx.s.charCodeAt(++ctx.p) !== 108 || ctx.s.charCodeAt(++ctx.p) !== 115 || ctx.s.charCodeAt(++ctx.p) !== 101)
      throw new TomlError("invalid value", { toml: ctx.s, ptr });
    ctx.p++;
    return false;
  }
  return parseValue(ctx, integersAsBigInt, end);
}
var init_extract = __esm({
  "node_modules/smol-toml/dist/extract.js"() {
    init_primitive();
    init_struct();
    init_error();
  }
});

// node_modules/smol-toml/dist/struct.js
function parseKey(ctx, end = "=") {
  let start = ctx.p;
  let dot = start - 1;
  let parsed = [];
  let endPtr = ctx.s.indexOf(end, start);
  if (endPtr < 0) {
    throw new TomlError("incomplete key-value: cannot find end of key", {
      toml: ctx.s,
      ptr: start
    });
  }
  do {
    let c2 = ctx.s.charCodeAt(ctx.p = ++dot);
    if (c2 !== 32 && c2 !== 9) {
      if (c2 === 34 || c2 === 39) {
        if (c2 === ctx.s.charCodeAt(ctx.p + 1) && c2 === ctx.s.charCodeAt(ctx.p + 2)) {
          throw new TomlError("multiline strings are not allowed in keys", {
            toml: ctx.s,
            ptr: ctx.p
          });
        }
        let part = parseString(ctx);
        dot = ctx.s.indexOf(".", ctx.p);
        let strEnd = ctx.s.slice(ctx.p, dot < 0 || dot > endPtr ? endPtr : dot);
        let newLine = indexOfNewline(strEnd);
        if (newLine > -1) {
          throw new TomlError("newlines are not allowed in keys", {
            toml: ctx.s,
            ptr: newLine
          });
        }
        if (strEnd.trimStart()) {
          throw new TomlError("found extra tokens after the string part", {
            toml: ctx.s,
            ptr: ctx.p
          });
        }
        if (endPtr < ctx.p) {
          endPtr = ctx.s.indexOf(end, ctx.p);
          if (endPtr < 0) {
            throw new TomlError("incomplete key-value: cannot find end of key", {
              toml: ctx.s,
              ptr: start
            });
          }
        }
        parsed.push(part);
      } else {
        dot = ctx.s.indexOf(".", ctx.p);
        let part = ctx.s.slice(ctx.p, dot < 0 || dot > endPtr ? endPtr : dot);
        if (!KEY_PART_RE.test(part)) {
          throw new TomlError("only letter, numbers, dashes and underscores are allowed in keys", {
            toml: ctx.s,
            ptr: ctx.p
          });
        }
        parsed.push(part.trimEnd());
      }
    }
  } while (dot + 1 && dot < endPtr);
  ctx.p = endPtr + 1;
  skipVoid(ctx, true, true);
  return parsed;
}
function parseInlineTable(ctx, integersAsBigInt) {
  let res = {};
  let seen = /* @__PURE__ */ new Set();
  let c2;
  ctx.p++;
  while (ctx.p < ctx.s.length) {
    skipVoid(ctx);
    if ((c2 = ctx.s.charCodeAt(ctx.p)) === 125) {
      ctx.p++;
      return res;
    }
    let k;
    let t2 = res;
    let hasOwn = false;
    let p = ctx.p;
    let key = parseKey(ctx);
    for (let i2 = 0; i2 < key.length; i2++) {
      if (i2)
        t2 = hasOwn ? t2[k] : t2[k] = {};
      k = key[i2];
      if ((hasOwn = Object.hasOwn(t2, k)) && (typeof t2[k] !== "object" || seen.has(t2[k]))) {
        throw new TomlError("trying to redefine an already defined value", {
          toml: ctx.s,
          ptr: p
        });
      }
      if (!hasOwn && k === "__proto__") {
        Object.defineProperty(t2, k, { enumerable: true, configurable: true, writable: true });
      }
    }
    if (hasOwn) {
      throw new TomlError("trying to redefine an already defined value", {
        toml: ctx.s,
        ptr: ctx.p
      });
    }
    let value = extractValue(ctx, 125, integersAsBigInt);
    seen.add(t2[k] = value);
    skipVoid(ctx);
    if ((c2 = ctx.s.charCodeAt(ctx.p++)) === 125) {
      return res;
    }
    if (c2 !== 44) {
      throw new TomlError("expected comma or end of structure", { toml: ctx.s, ptr: ctx.p - 1 });
    }
  }
  throw new TomlError("unfinished table encountered", {
    toml: ctx.s,
    ptr: ctx.p
  });
}
function parseArray(ctx, integersAsBigInt) {
  let res = [];
  let c2;
  ctx.p++;
  while (ctx.p < ctx.s.length) {
    skipVoid(ctx);
    if ((c2 = ctx.s.charCodeAt(ctx.p)) === 93) {
      ctx.p++;
      return res;
    }
    res.push(extractValue(ctx, 93, integersAsBigInt));
    skipVoid(ctx);
    if ((c2 = ctx.s.charCodeAt(ctx.p++)) === 93) {
      return res;
    }
    if (c2 !== 44) {
      throw new TomlError("expected comma or end of structure", { toml: ctx.s, ptr: ctx.p - 1 });
    }
  }
  throw new TomlError("unfinished array encountered", {
    toml: ctx.s,
    ptr: ctx.p
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
  let ctx = { s: toml, p: 0, d: maxDepth };
  let res = {};
  let meta = {};
  let tmp;
  let tbl = res;
  let m = meta;
  skipVoid(ctx);
  while (ctx.p < toml.length) {
    if (toml.charCodeAt(ctx.p) === 91) {
      let isTableArray = toml.charCodeAt(++ctx.p) === 91;
      tmp = ctx.p += +isTableArray;
      let k = parseKey(ctx, "]");
      if (isTableArray) {
        if (toml.charCodeAt(ctx.p - 1) !== 93) {
          throw new TomlError("expected end of table declaration", {
            toml,
            ptr: ctx.p - 1
          });
        }
        ctx.p++;
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
      tmp = ctx.p;
      let k = parseKey(ctx);
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
      p[1][p[0]] = extractValue(ctx, void 0, integersAsBigInt);
    }
    skipVoid(ctx, true);
    if (ctx.p < toml.length && (tmp = toml.charCodeAt(ctx.p)) !== 10 && tmp !== 13) {
      throw new TomlError("each key-value declaration must be followed by an end-of-line", {
        toml,
        ptr: ctx.p
      });
    }
    skipVoid(ctx);
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

// src/machine.ts
var machine_exports = {};
__export(machine_exports, {
  loadMachine: () => loadMachine,
  machineExists: () => machineExists,
  saveMachine: () => saveMachine,
  shareDir: () => shareDir
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
    share: d.share ?? d.repo,
    // `repo`: the key's old name, rewritten by cs doctor --fix
    secretsBackend: d.secrets?.backend ?? "sops"
  };
}
function saveMachine(m) {
  const obj = { name: m.name, profiles: m.profiles, exclude: m.exclude };
  if (m.workspace) obj.workspace = m.workspace;
  if (m.share) obj.share = m.share;
  obj.secrets = { backend: m.secretsBackend };
  mkdirSync(dirname(machineFile()), { recursive: true });
  writeFileSync(machineFile(), "# claude-share machine config (not synced). Edit freely.\n" + stringify(obj) + "\n");
}
var shareDir;
var init_machine = __esm({
  "src/machine.ts"() {
    "use strict";
    init_dist5();
    init_paths();
    shareDir = (m) => m.share ? expand(m.share) : !existsSync(shareDirDefault()) && existsSync(legacyShareDir()) ? legacyShareDir() : shareDirDefault();
  }
});

// src/proc.ts
var proc_exports = {};
__export(proc_exports, {
  exec: () => exec2,
  shell: () => shell
});
import { spawn } from "node:child_process";
function exec2(cmd, args, opts = {}) {
  return new Promise((resolve7) => {
    const p = spawn(cmd, args, { cwd: opts.cwd, env: opts.env ?? process.env, stdio: ["pipe", "pipe", "pipe"], detached: !!opts.group });
    let out2 = "", err = "", done = false;
    const finish2 = (r2) => {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      resolve7(r2);
    };
    const timer = opts.timeout ? setTimeout(() => {
      if (opts.group) {
        try {
          process.kill(-p.pid, "SIGKILL");
        } catch {
        }
      } else p.kill("SIGKILL");
      p.stdout.destroy();
      p.stderr.destroy();
      finish2({ code: 124, out: out2.trim(), err: (err + "\ntimed out").trim() });
    }, opts.timeout * 1e3) : void 0;
    p.stdout.on("data", (d) => out2 += d);
    p.stderr.on("data", (d) => err += d);
    p.on("error", (e) => finish2({ code: 127, out: out2, err: err + e.message }));
    p.on("close", (code) => finish2({ code: code ?? 1, out: out2.trim(), err: err.trim() }));
    p.stdin.on("error", () => {
    });
    if (opts.input !== void 0) p.stdin.write(opts.input);
    p.stdin.end();
  });
}
var shell;
var init_proc = __esm({
  "src/proc.ts"() {
    "use strict";
    shell = (cmd, opts = {}) => exec2("bash", ["-lc", cmd], opts);
  }
});

// src/git.ts
import { spawnSync } from "node:child_process";
import { existsSync as existsSync2, readFileSync as readFileSync3, statSync } from "node:fs";
import { join as join3, resolve as resolve2, isAbsolute as isAbsolute2 } from "node:path";
function git(args, cwd, opts = {}) {
  const env2 = { ...process.env, ...opts.env ?? {} };
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
async function gitA(args, cwd, opts = {}) {
  const { exec: exec4 } = await Promise.resolve().then(() => (init_proc(), proc_exports));
  const env2 = { ...process.env, ...opts.env ?? {} };
  if (opts.sshKey) env2.GIT_SSH_COMMAND = `ssh -i ${opts.sshKey} -o IdentitiesOnly=yes`;
  const r2 = await exec4("git", args, { cwd, env: env2, timeout: opts.timeout });
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
function upstream(p, branch) {
  const remote = configGet(p, `branch.${branch}.remote`), ref = configGet(p, `branch.${branch}.merge`);
  return remote && ref ? { remote, ref } : void 0;
}
function commonDir(p) {
  const c2 = out(["rev-parse", "--git-common-dir"], p);
  return isAbsolute2(c2) ? c2 : resolve2(p, c2);
}
function commit(p, message, fallbackName = "cs", fallbackEmail = "cs@localhost") {
  git([...identityArgs(p, fallbackName, fallbackEmail), "commit", "-q", "-m", message], p);
}
function rebaseStep(p) {
  const read = (f) => {
    try {
      return readFileSync3(join3(commonDir(p), "rebase-merge", f), "utf8").trim();
    } catch {
      return "";
    }
  };
  return read("msgnum") ? `${read("msgnum")}/${read("end")}` : "";
}
function canonicalGithub(url) {
  let u5 = url.trim();
  if (u5.startsWith("https://github.com/")) u5 = "git@github.com:" + u5.slice("https://github.com/".length);
  else if (u5.startsWith("ssh://git@github.com/")) u5 = "git@github.com:" + u5.slice("ssh://git@github.com/".length);
  else if (u5.startsWith("git@github-") && u5.includes(":")) u5 = "git@github.com:" + u5.split(":").slice(1).join(":");
  if (!u5.endsWith(".git")) u5 += ".git";
  return u5;
}
function trailers(p, sha) {
  const t2 = out(["log", "-1", "--format=%(trailers:only,unfold)", sha], p);
  const o = {};
  for (const l2 of t2.split("\n")) {
    const i2 = l2.indexOf(":");
    if (i2 > 0) o[l2.slice(0, i2).trim()] = l2.slice(i2 + 1).trim();
  }
  return o;
}
var out, isRepo, isBare, toplevel, remoteUrl, currentBranch, dirtyCount, isDirty, worktrees, infoExclude, configGet, identityArgs, rebaseInProgress, slug;
var init_git = __esm({
  "src/git.ts"() {
    "use strict";
    out = (args, cwd, dflt = "") => {
      const r2 = git(args, cwd, { check: false });
      return r2.code === 0 ? r2.out : dflt;
    };
    isRepo = (p) => existsSync2(join3(p, ".git"));
    isBare = (p) => existsSync2(join3(p, "HEAD")) && existsSync2(join3(p, "objects"));
    toplevel = (p) => out(["rev-parse", "--show-toplevel"], p) || void 0;
    remoteUrl = (p, name2 = "origin") => out(["remote", "get-url", name2], p);
    currentBranch = (p) => out(["symbolic-ref", "--short", "-q", "HEAD"], p);
    dirtyCount = (p) => {
      const s = out(["status", "--porcelain", "--untracked-files=normal"], p);
      return s ? s.split("\n").length : 0;
    };
    isDirty = (p) => dirtyCount(p) > 0;
    worktrees = (p) => out(["worktree", "list", "--porcelain"], p).split("\n").filter((l2) => l2.startsWith("worktree ")).map((l2) => l2.slice(9));
    infoExclude = (p) => join3(commonDir(p), "info", "exclude");
    configGet = (p, key) => out(["config", "--get", key], p);
    identityArgs = (p, fallbackName = "cs", fallbackEmail = "cs@localhost") => configGet(p, "user.email") ? [] : ["-c", `user.name=${fallbackName}`, "-c", `user.email=${fallbackEmail}`];
    rebaseInProgress = (p) => existsSync2(join3(commonDir(p), "rebase-merge")) || existsSync2(join3(commonDir(p), "rebase-apply"));
    slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "x";
  }
});

// src/manifest.ts
import { existsSync as existsSync3, readFileSync as readFileSync4 } from "node:fs";
import { join as join4, isAbsolute as isAbsolute3, resolve as resolve3 } from "node:path";
function globMatch(pattern, s) {
  let re = "^";
  for (let i2 = 0; i2 < pattern.length; i2++) {
    const c2 = pattern[i2];
    if (c2 === "*" && pattern[i2 + 1] === "*") {
      if (pattern[i2 + 2] === "/") {
        re += "(?:.*/)?";
        i2 += 2;
      } else {
        re += ".*";
        i2++;
      }
    } else if (c2 === "*") re += "[^/]*";
    else if (c2 === "?") re += "[^/]";
    else re += c2.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(re + "$").test(s);
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
  const ws = resolve3(workspace(man, m));
  const r2 = resolve3(path);
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
      path: v.path,
      url: v.url || void 0,
      identity: v.identity || void 0,
      profiles: v.profiles ?? ["all"],
      machines: v.machines ?? [],
      branch: v.branch,
      layout: v.layout ?? "plain",
      postClone: v.post_clone,
      description: v.description,
      handoff: v.handoff ?? {},
      env: v.env === false ? false : v.env && typeof v.env === "object" ? { local: v.env.local } : void 0
    };
  return { workspaceRoot: d.workspace?.root ?? "~/dev", defaultBranch: d.workspace?.default_branch ?? "master", identities, projects, schemaVersion: d.schema_version ?? 1, path };
}
function validate(m) {
  const errs = [];
  if (m.schemaVersion > SUPPORTED_SCHEMA) errs.push(`projects.toml schema_version ${m.schemaVersion} > supported ${SUPPORTED_SCHEMA}; run cs update`);
  for (const i2 of Object.values(m.identities)) if (!i2.owner && !i2.urlGlobs?.length) errs.push(`identity ${i2.id}: needs owner (GitHub user/org)`);
  for (const p of Object.values(m.projects)) {
    if (!NAME_RE.test(p.name)) errs.push(`${p.name}: invalid project name`);
    if (p.url) {
      if (!p.identity) errs.push(`${p.name}: url requires identity`);
      else if (!m.identities[p.identity]) errs.push(`${p.name}: unknown identity '${p.identity}'`);
      else if (!identityMatches(m.identities[p.identity], p.url)) errs.push(`${p.name}: url ${p.url} does not match identity '${p.identity}'`);
    } else if (p.identity && !m.identities[p.identity]) errs.push(`${p.name}: unknown identity '${p.identity}'`);
    if (p.path && (isAbsolute3(p.path) || p.path.split("/").includes(".."))) errs.push(`${p.name}: path must be relative and inside the workspace`);
  }
  return errs;
}
function loadManifest(repo) {
  const f = join4(repo, "projects.toml");
  if (!existsSync3(f)) throw new Error(`cs: no projects.toml in ${repo}`);
  const m = parseManifest(readFileSync4(f, "utf8"), f);
  const errs = validate(m);
  if (errs.length) throw new Error("cs: projects.toml invalid:\n  " + errs.join("\n  "));
  return m;
}
function block2(header, values) {
  const clean2 = {};
  for (const [k, v] of Object.entries(values)) if (v !== void 0 && v !== "" && !(Array.isArray(v) && !v.length)) clean2[k] = v;
  return `[${header}]
` + stringify(clean2).trimEnd() + "\n";
}
function projectBlock(p) {
  return block2(`projects.${p.name}`, {
    path: p.path && p.path !== p.name ? p.path : void 0,
    url: p.url,
    identity: p.identity,
    branch: p.branch,
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
function addProjectText(text3, p) {
  if (projectTableRe(p.name, "m").test(text3)) throw new Error(`cs: project '${p.name}' already registered (edit projects.toml to change it)`);
  return text3.replace(/\n*$/, "\n\n") + projectBlock(p);
}
function updateProjectText(text3, p) {
  const lines = text3.split("\n");
  const start = lines.findIndex((l2) => new RegExp(`^\\[projects\\.${p.name.replace(/[.]/g, "\\.")}\\]\\s*(#.*)?$`).test(l2));
  if (start < 0) throw new Error(`cs: project '${p.name}' not found in projects.toml`);
  let end = start + 1;
  while (end < lines.length && !/^\[/.test(lines[end])) end++;
  while (end > start + 1 && lines[end - 1].trim() === "") end--;
  const body = projectBlock(p).trimEnd().split("\n").slice(1);
  return [...lines.slice(0, start + 1), ...body, ...lines.slice(end)].join("\n");
}
function removeProjectText(text3, name2) {
  const mine = projectTableRe(name2);
  const lines = text3.split("\n");
  const keep = [];
  let found = false, skipping = false;
  for (const l2 of lines) {
    if (/^\s*\[/.test(l2)) skipping = mine.test(l2.trim());
    if (skipping) {
      found = true;
      continue;
    }
    keep.push(l2);
  }
  if (!found) return { text: text3, found };
  while (keep.length > 1 && keep[keep.length - 1] === "" && keep[keep.length - 2] === "") keep.pop();
  return { text: keep.join("\n"), found };
}
function addIdentityText(text3, i2) {
  if (new RegExp(`^\\[identities\\.${i2.id.replace(/[.]/g, "\\.")}\\]\\s*$`, "m").test(text3)) throw new Error(`cs: identity '${i2.id}' already exists`);
  const marker = "# ---- Projects";
  const b = identityBlock(i2);
  return text3.includes(marker) ? text3.slice(0, text3.indexOf(marker)).replace(/\n*$/, "\n\n") + b + "\n" + text3.slice(text3.indexOf(marker)) : text3.replace(/\n*$/, "\n\n") + b;
}
function renameIdentityText(text3, oldId, newId) {
  const esc = oldId.replace(/[.]/g, "\\.");
  return text3.replace(new RegExp(`^\\[identities\\.${esc}\\]`, "m"), `[identities.${newId}]`).replace(new RegExp(`^(identity\\s*=\\s*)"${esc}"`, "mg"), `$1"${newId}"`);
}
var SUPPORTED_SCHEMA, NAME_RE, keyPath, globs, identityMatches, workspace, selectedProjects, projectTableRe;
var init_manifest = __esm({
  "src/manifest.ts"() {
    "use strict";
    init_dist5();
    init_paths();
    SUPPORTED_SCHEMA = 1;
    NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
    keyPath = (i2) => i2.sshKey || `~/.ssh/cs/${i2.id}`;
    globs = (i2) => [...i2.urlGlobs?.length ? i2.urlGlobs : i2.owner ? [`git@github.com:${i2.owner}/**`] : [], ...process.env.CS_FAKE_GITHUB && i2.owner ? [`${process.env.CS_FAKE_GITHUB}/${i2.owner}/**`] : []];
    identityMatches = (i2, url) => globs(i2).some((g) => globMatch(g, url));
    workspace = (man, m) => expand(m?.workspace || man.workspaceRoot);
    selectedProjects = (man, m) => Object.values(man.projects).filter((p) => selected(p, m));
    projectTableRe = (name2, flags = "") => new RegExp(`^\\[projects\\.${name2.replace(/[.]/g, "\\.")}(\\.[^\\]]+)?\\]\\s*(#.*)?$`, flags);
  }
});

// src/share.ts
var share_exports = {};
__export(share_exports, {
  addIdentity: () => addIdentity,
  addProject: () => addProject,
  commit: () => commit2,
  manifestText: () => manifestText,
  open: () => open,
  projectForPath: () => projectForPath2,
  reload: () => reload,
  removeProject: () => removeProject,
  renameIdentity: () => renameIdentity,
  selectedProjects: () => selectedProjects2,
  stampOf: () => stampOf,
  updateProject: () => updateProject,
  workspace: () => workspace2
});
import { readFileSync as readFileSync5, statSync as statSync2, writeFileSync as writeFileSync2 } from "node:fs";
import { isAbsolute as isAbsolute4, join as join5, relative as relative2 } from "node:path";
function open(machine = loadMachine(), path = shareDir(machine)) {
  return { path, machine, manifest: loadManifest(path) };
}
function reload(share) {
  share.manifest = loadManifest(share.path);
  return share;
}
function edit(share, transform) {
  const before = manifestText(share), after = transform(before);
  if (after === before) return;
  writeFileSync2(manifestFile(share), after);
  reload(share);
}
function removeProject(share, name2) {
  let found = false;
  edit(share, (t2) => {
    const r2 = removeProjectText(t2, name2);
    found = r2.found;
    return r2.text;
  });
  return found;
}
function commit2(share, message, paths) {
  if (!isRepo(share.path)) return void 0;
  if (paths) for (const p of paths) git(["add", "-A", "--", p], share.path, { check: false });
  else git(["add", "-A"], share.path);
  if (git(["diff", "--cached", "--quiet"], share.path, { check: false }).code === 0) return void 0;
  commit(share.path, `${message}

Cs-Machine: ${share.machine.name}`, "cs", `cs@${share.machine.name}`);
  return out(["rev-parse", "--short", "HEAD"], share.path);
}
function stampOf(share, file) {
  const rel = isAbsolute4(file) ? relative2(share.path, file) : file;
  const [when2, subject, email2, trailer] = out(["log", "-1", "--format=%cI%n%s%n%ae%n%(trailers:key=Cs-Machine,valueonly,separator=%x20)", "--", rel], share.path).split("\n");
  if (when2 && git(["diff", "--quiet", "--", rel], share.path, { check: false }).code === 0) {
    const from = trailer?.trim() || subject?.match(/^sync\(([^)]+)\):/)?.[1] || (email2?.startsWith("cs@") ? email2.slice(3) : void 0);
    return from ? { when: when2, from } : { when: when2 };
  }
  return { when: new Date(statSync2(join5(share.path, rel)).mtimeMs).toISOString() };
}
var workspace2, selectedProjects2, projectForPath2, manifestFile, manifestText, addProject, updateProject, addIdentity, renameIdentity;
var init_share = __esm({
  "src/share.ts"() {
    "use strict";
    init_git();
    init_machine();
    init_manifest();
    init_manifest();
    workspace2 = (share) => workspace(share.manifest, share.machine);
    selectedProjects2 = (share) => selectedProjects(share.manifest, share.machine);
    projectForPath2 = (share, path) => projectForPath(share.manifest, share.machine, path);
    manifestFile = (share) => join5(share.path, "projects.toml");
    manifestText = (share) => readFileSync5(manifestFile(share), "utf8");
    addProject = (share, p) => edit(share, (t2) => addProjectText(t2, p));
    updateProject = (share, p) => edit(share, (t2) => updateProjectText(t2, p));
    addIdentity = (share, i2) => edit(share, (t2) => addIdentityText(t2, i2));
    renameIdentity = (share, oldId, newId) => edit(share, (t2) => renameIdentityText(t2, oldId, newId));
  }
});

// src/update.ts
var update_exports = {};
__export(update_exports, {
  behindCount: () => behindCount,
  behindHint: () => behindHint,
  runUpdate: () => runUpdate,
  startUpdateCheck: () => startUpdateCheck
});
import { mkdirSync as mkdirSync2, readFileSync as readFileSync6, writeFileSync as writeFileSync3 } from "node:fs";
import { join as join6 } from "node:path";
function readCache() {
  try {
    return JSON.parse(readFileSync6(cacheFile(), "utf8"));
  } catch {
    return { checkedAt: 0, behind: 0 };
  }
}
function writeCache(c2) {
  try {
    mkdirSync2(stateDir(), { recursive: true });
    writeFileSync3(cacheFile(), JSON.stringify(c2));
  } catch {
  }
}
async function startUpdateCheck() {
  const root = toolRoot();
  const cache = readCache();
  if (process.env.CS_OFFLINE || !isRepo(root)) return async () => 0;
  if (Date.now() - cache.checkedAt < 24 * 3600 * 1e3) return async () => cache.behind;
  const { exec: exec4 } = await Promise.resolve().then(() => (init_proc(), proc_exports));
  const run = exec4("git", ["fetch", "-q", "origin"], { cwd: root, timeout: 3 }).then((r2) => {
    if (r2.code !== 0) return cache.behind;
    const branch = currentBranch(root) || "master";
    const behind = parseInt(out(["rev-list", "--count", `HEAD..origin/${branch}`], root, "0"), 10) || 0;
    writeCache({ checkedAt: Date.now(), behind });
    return behind;
  }).catch(() => 0);
  return () => run;
}
async function runUpdate() {
  const root = toolRoot();
  if (!isRepo(root)) throw new Error(`cs: ${root} is not a git checkout`);
  const before = out(["rev-parse", "--short", "HEAD"], root);
  const r2 = await spin("checking for updates\u2026", () => gitA(["pull", "-q", "--ff-only"], root, { check: false, timeout: 60 }));
  if (r2.code !== 0) throw new Error(`cs: update failed
${r2.err}`);
  const after = out(["rev-parse", "--short", "HEAD"], root);
  if (before === after) ok(`already up to date  ${dim(`(${after})`)}`);
  else {
    const n3 = out(["rev-list", "--count", `${before}..${after}`], root);
    ok(`updated ${before} \u2192 ${after}  ${dim(`${n3} commit(s)`)}`);
    for (const l2 of out(["log", "--format=%s", `${before}..${after}`], root).split("\n").slice(0, 8)) info(dim("\u2022 " + l2));
  }
  writeCache({ checkedAt: Date.now(), behind: 0 });
}
var cacheFile, behindCount, behindHint;
var init_update = __esm({
  "src/update.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_ui();
    cacheFile = () => join6(stateDir(), "update-check.json");
    behindCount = (finish2, graceMs = 50) => Promise.race([finish2(), new Promise((r2) => setTimeout(() => r2(0), graceMs))]);
    behindHint = (behind) => behind > 0 ? yellow(`cs is ${behind} commit(s) behind \u2014 run ${bold("cs update")}`) : "";
  }
});

// src/lock.ts
import { closeSync, mkdirSync as mkdirSync3, openSync, readFileSync as readFileSync7, unlinkSync, writeFileSync as writeFileSync4 } from "node:fs";
import { join as join7 } from "node:path";
function acquire() {
  mkdirSync3(stateDir(), { recursive: true });
  const take = () => {
    const fd = openSync(lockFile(), "wx");
    writeFileSync4(fd, String(process.pid));
    closeSync(fd);
  };
  try {
    take();
  } catch {
    const pid = holder();
    if (pid === process.pid) return () => {
    };
    if (pid && alive(pid)) return void 0;
    try {
      unlinkSync(lockFile());
      take();
    } catch {
      return void 0;
    }
  }
  return () => {
    try {
      if (holder() === process.pid) unlinkSync(lockFile());
    } catch {
    }
  };
}
var lockFile, holder, alive;
var init_lock = __esm({
  "src/lock.ts"() {
    "use strict";
    init_paths();
    lockFile = () => join7(stateDir(), "sync.lock");
    holder = () => {
      try {
        return parseInt(readFileSync7(lockFile(), "utf8"), 10);
      } catch {
        return NaN;
      }
    };
    alive = (pid) => {
      try {
        process.kill(pid, 0);
        return true;
      } catch {
        return false;
      }
    };
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
import { existsSync as existsSync4, lstatSync, mkdirSync as mkdirSync4, readdirSync, readFileSync as readFileSync8, readlinkSync, realpathSync, renameSync, rmSync, statSync as statSync3, symlinkSync, unlinkSync as unlinkSync2, writeFileSync as writeFileSync5, copyFileSync } from "node:fs";
import { basename, dirname as dirname2, join as join8, resolve as resolve4 } from "node:path";
function backup(target) {
  const d = join8(stateDir(), "backups", stamp());
  mkdirSync4(d, { recursive: true });
  const dest = join8(d, basename(target));
  if (statSync3(target).isDirectory()) renameSync(target, dest);
  else {
    copyFileSync(target, dest);
    unlinkSync2(target);
  }
}
function mergeDirInto(src, dst) {
  const walk2 = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const f = join8(dir, e.name);
      if (e.isDirectory()) walk2(f);
      else {
        const rel = f.slice(dst.length + 1);
        const t2 = join8(src, rel);
        if (!existsSync4(t2)) {
          mkdirSync4(dirname2(t2), { recursive: true });
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
    if (resolve4(dirname2(dst), readlinkSync(dst)) === resolve4(src) || real(dst) === real(src)) return;
    changes.push(`relink ${contract(dst)}`);
    if (!check) {
      unlinkSync2(dst);
      symlinkSync(src, dst);
    }
    return;
  }
  if (existsSync4(dst)) {
    if (statSync3(dst).isDirectory()) {
      changes.push(`import ${contract(dst)} \u2192 ${contract(src)} (merge)`);
      if (!check) {
        mkdirSync4(src, { recursive: true });
        mergeDirInto(src, dst);
        symlinkSync(src, dst);
      }
    } else if (!existsSync4(src)) {
      changes.push(`import ${contract(dst)} \u2192 ${contract(src)}`);
      if (!check) {
        mkdirSync4(dirname2(src), { recursive: true });
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
  if (!existsSync4(src)) return;
  changes.push(`link ${contract(dst)}`);
  if (!check) {
    mkdirSync4(dirname2(dst), { recursive: true });
    symlinkSync(src, dst);
  }
}
function settingsLayers(share) {
  const m = share.machine;
  const names = ["settings.base.json", ...m.profiles.map((p) => `settings.${p}.json`), `settings.${m.name}.json`];
  return names.filter((n3) => existsSync4(join8(share.path, "claude", n3))).map((n3) => [n3, loads(readFileSync8(join8(share.path, "claude", n3), "utf8"))]);
}
function applySettings(share, check, changes) {
  if (!settingsLayers(share).length) return;
  const target = join8(claudeDir(), "settings.json");
  const desired = renderSettings(share);
  const current = existsSync4(target) ? loads(readFileSync8(target, "utf8")) : {};
  if (JSON.stringify(current) === JSON.stringify(desired)) return;
  const keys = diffKeys(current, desired);
  changes.push(`settings.json: ${keys.slice(0, 8).join(", ")}${keys.length > 8 ? " \u2026" : ""}`);
  if (!check) {
    mkdirSync4(claudeDir(), { recursive: true });
    if (existsSync4(target)) {
      const d = join8(stateDir(), "backups", stamp());
      mkdirSync4(d, { recursive: true });
      copyFileSync(target, join8(d, "settings.json"));
    }
    writeFileSync5(target, dumps(desired));
  }
}
function applyLinks(repo, check, changes) {
  const cdir = claudeDir();
  mkdirSync4(cdir, { recursive: true });
  for (const item of LINK_ITEMS) link(join8(repo, "claude", item), join8(cdir, item), check, changes);
  const skills = join8(repo, "claude", "skills"), agents = join8(home(), ".agents");
  link(skills, join8(agents, "skills"), check, changes);
  link(join8(repo, "claude", "skill-lock.json"), join8(agents, ".skill-lock.json"), check, changes);
  if (existsSync4(skills)) {
    mkdirSync4(join8(cdir, "skills"), { recursive: true });
    for (const e of readdirSync(skills, { withFileTypes: true })) if (e.isDirectory()) link(join8(skills, e.name), join8(cdir, "skills", e.name), check, changes);
  }
  link(join8(repo, "plans"), join8(cdir, "plans"), check, changes);
}
function renderGitIncludes(man) {
  const gdir = join8(home(), ".config", "git");
  const files = {};
  const inc = ["# generated by `cs apply` \u2014 do not edit; edit projects.toml [identities] instead"];
  for (const i2 of Object.values(man.identities)) {
    files[join8(gdir, `identity-${i2.id}.inc`)] = [
      `# identity '${i2.id}' (generated by cs apply)`,
      "[user]",
      `	name = ${i2.name}`,
      `	email = ${i2.email}`,
      "[core]",
      `	sshCommand = ssh -i ${contract(expand(keyPath(i2)))} -o IdentitiesOnly=yes`
    ].join("\n") + "\n";
    for (const g of globs(i2)) inc.push(`[includeIf "hasconfig:remote.*.url:${g}"]`, `	path = identity-${i2.id}.inc`);
  }
  files[join8(gdir, "claude-share.inc")] = inc.join("\n") + "\n";
  return files;
}
function applyGit(man, check, changes) {
  const gdir = join8(home(), ".config", "git");
  const wanted = renderGitIncludes(man);
  if (existsSync4(gdir)) {
    for (const f of readdirSync(gdir)) if (/^identity-.*\.inc$/.test(f) && !(join8(gdir, f) in wanted)) {
      changes.push(`remove stale ${contract(join8(gdir, f))}`);
      if (!check) unlinkSync2(join8(gdir, f));
    }
  }
  for (const [f, content] of Object.entries(wanted)) {
    if (existsSync4(f) && readFileSync8(f, "utf8") === content) continue;
    changes.push(`write ${contract(f)}`);
    if (!check) {
      mkdirSync4(gdir, { recursive: true });
      writeFileSync5(f, content);
    }
  }
  const gc = join8(home(), ".gitconfig");
  const text3 = existsSync4(gc) ? readFileSync8(gc, "utf8") : "";
  const block3 = `${GIT_MARK}
[include]
	path = ~/.config/git/claude-share.inc
${GIT_END}
`;
  const next = text3.includes(GIT_MARK) ? text3.slice(0, text3.indexOf(GIT_MARK)) + block3 + text3.slice(text3.indexOf(GIT_END) + GIT_END.length + 1) : text3 + (text3 && !text3.endsWith("\n") ? "\n" : "") + block3;
  if (next !== text3) {
    changes.push("~/.gitconfig: include claude-share.inc");
    if (!check) writeFileSync5(gc, next);
  }
}
function applyShellRc(check, changes) {
  const rc = shellRc();
  const sh2 = contract(join8(toolRoot(), "shell", "cs.sh"));
  const block3 = `${GIT_MARK}
[ -f "${sh2}" ] && . "${sh2}"
${GIT_END}
`;
  const text3 = existsSync4(rc) ? readFileSync8(rc, "utf8") : "";
  const next = text3.includes(GIT_MARK) ? text3.slice(0, text3.indexOf(GIT_MARK)) + block3 + text3.slice(text3.indexOf(GIT_END) + GIT_END.length + 1) : text3 + (text3 && !text3.endsWith("\n") ? "\n" : "") + block3;
  if (next !== text3) {
    changes.push(`${contract(rc)}: source shell/cs.sh (claude() wrapper, PATH)`);
    if (!check) writeFileSync5(rc, next);
  }
}
function runApply(share, check = false) {
  const changes = [];
  applySettings(share, check, changes);
  applyLinks(share.path, check, changes);
  applyGit(share.manifest, check, changes);
  applyShellRc(check, changes);
  for (const c2 of changes) check ? info(c2) : step(c2);
  if (!changes.length) ok("~/.claude up to date");
  return changes;
}
var LINK_ITEMS, GIT_MARK, GIT_END, stamp, isLink, real, renderSettings;
var init_apply = __esm({
  "src/apply.ts"() {
    "use strict";
    init_paths();
    init_platform();
    init_manifest();
    init_jsonmerge();
    init_ui();
    LINK_ITEMS = ["CLAUDE.md", "rules", "agents", "themes", "keybindings.json", "statusline.sh"];
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
    real = (p) => {
      try {
        return realpathSync(p);
      } catch {
        return resolve4(p);
      }
    };
    renderSettings = (share) => mergeLayers(...settingsLayers(share).map(([, d]) => d));
  }
});

// src/import.ts
var import_exports = {};
__export(import_exports, {
  candidatePaths: () => candidatePaths,
  claudeProjectKey: () => claudeProjectKey,
  envVarName: () => envVarName,
  importMcp: () => importMcp,
  importMemory: () => importMemory,
  importProjectFiles: () => importProjectFiles,
  runImport: () => runImport,
  unionLines: () => unionLines
});
import { copyFileSync as copyFileSync2, existsSync as existsSync5, mkdirSync as mkdirSync5, readdirSync as readdirSync2, readFileSync as readFileSync9, writeFileSync as writeFileSync6 } from "node:fs";
import { basename as basename2, dirname as dirname3, extname, join as join9, relative as relative3 } from "node:path";
function candidatePaths(p, ws) {
  const c2 = [container(p, ws), checkoutRoot(p, ws), ...dirs(p, ws)];
  return [...new Set(c2)];
}
function walkFiles(dir) {
  const out2 = [];
  const rec = (d) => {
    for (const e of readdirSync2(d, { withFileTypes: true })) {
      const f = join9(d, e.name);
      e.isDirectory() ? rec(f) : out2.push(f);
    }
  };
  if (existsSync5(dir)) rec(dir);
  return out2.sort();
}
function importMemory(share, p, check = false) {
  const dest = memoryDir(share, p.name), machine = share.machine.name, ws = workspace2(share);
  let n3 = 0;
  for (const cand of candidatePaths(p, ws)) {
    const src = join9(claudeDir(), "projects", claudeProjectKey(cand), "memory");
    if (!existsSync5(src)) continue;
    info(`${p.name}: importing memory from ${contract(src)}`);
    for (const f of walkFiles(src)) {
      const rel = relative3(src, f);
      const target = join9(dest, rel);
      if (!existsSync5(target)) {
        step(`+ ${rel}`);
        if (!check) {
          mkdirSync5(dirname3(target), { recursive: true });
          copyFileSync2(f, target);
        }
        n3++;
      } else if (readFileSync9(target).equals(readFileSync9(f))) continue;
      else if (basename2(rel) === "MEMORY.md") {
        step(`~ ${rel} (union)`);
        if (!check) writeFileSync6(target, unionLines(readFileSync9(target, "utf8"), readFileSync9(f, "utf8")));
        n3++;
      } else {
        const alt = join9(dirname3(target), `${basename2(rel, extname(rel))}.from-${machine}-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}${extname(rel)}`);
        step(`? ${rel} differs \u2192 ${basename2(alt)}`);
        if (!check) copyFileSync2(f, alt);
        n3++;
      }
    }
    if (!check) writeFileSync6(join9(dirname3(src), "memory.imported-by-cs"), `imported into ${contract(dest)} on ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}
`);
  }
  if (!n3) ok(`${p.name}: no new memory to import`);
  return n3;
}
function importProjectFiles(share, p, check = false) {
  const ch = place(share, p, { check });
  for (const c2 of ch) step(`${p.name}: ${c2}`);
  if (!ch.length) ok(`${p.name}: nothing to import`);
  return ch.length;
}
function envVarName(server, key) {
  const st = server.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
  let kt = key.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
  if (st.length && kt.length && kt[0] === st[0]) kt = kt.slice(1);
  return [...st, ...kt].join("_");
}
function localScope(p, ws) {
  if (!existsSync5(claudeJson())) return {};
  const data = JSON.parse(readFileSync9(claudeJson(), "utf8"));
  const found = {};
  for (const cand of candidatePaths(p, ws)) for (const [n3, cfg] of Object.entries(data.projects?.[cand]?.mcpServers ?? {})) found[n3] ??= cfg;
  return found;
}
function importMcp(share, p, check = false, show = false) {
  const found = localScope(p, workspace2(share));
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
  const side = projectState(share, p.name);
  const f = join9(side, ".mcp.json");
  const existing = existsSync5(f) ? loads(readFileSync9(f, "utf8")) : { mcpServers: {} };
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
    mkdirSync5(join9(side, ".claude"), { recursive: true });
    writeFileSync6(f, dumps(existing));
    const sl = join9(side, ".claude", "settings.local.json");
    const sd = existsSync5(sl) ? loads(readFileSync9(sl, "utf8")) : {};
    sd.enabledMcpjsonServers = [.../* @__PURE__ */ new Set([...sd.enabledMcpjsonServers ?? [], ...Object.keys(existing.mcpServers)])].sort();
    writeFileSync6(sl, dumps(sd));
  }
  if (Object.keys(secrets).length) {
    warn(`${p.name}: values replaced by \${VAR} placeholders \u2014 store them: cs secrets set global ${Object.keys(secrets).map((k) => `${k}=\u2026`).join(" ")}  (full values: cs import mcp ${p.name} --show)`);
  }
  return Object.keys(found).length;
}
function runImport(share, what, names, check, show) {
  const man = share.manifest;
  if (!names.length) throw new Error("cs: import needs a project name (or --all)");
  for (const n3 of names) {
    const p = man.projects[n3];
    if (!p) throw new Error(`cs: unknown project '${n3}'`);
    if (what === "memory") importMemory(share, p, check);
    else if (what === "project") importProjectFiles(share, p, check);
    else if (what === "mcp") importMcp(share, p, check, show);
    else throw new Error(`cs: unknown import target '${what}'`);
  }
}
var claudeProjectKey, unionLines;
var init_import = __esm({
  "src/import.ts"() {
    "use strict";
    init_paths();
    init_share();
    init_checkout();
    init_projectstate();
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

// src/deps.ts
var deps_exports = {};
__export(deps_exports, {
  runDeps: () => runDeps,
  which: () => which
});
import { chmodSync, copyFileSync as copyFileSync3, existsSync as existsSync6, mkdirSync as mkdirSync6, rmSync as rmSync2 } from "node:fs";
import { join as join10 } from "node:path";
import { spawnSync as spawnSync2 } from "node:child_process";
import { arch } from "node:os";
function which(cmd) {
  for (const d of [...(process.env.PATH ?? "").split(":"), BIN()]) if (d && existsSync6(join10(d, cmd))) return join10(d, cmd);
  return void 0;
}
async function latest(repo) {
  const r2 = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers: { "User-Agent": "claude-share" } });
  return (await r2.json()).tag_name;
}
async function download(url, dest) {
  const r2 = await fetch(url, { headers: { "User-Agent": "claude-share" } });
  if (!r2.ok) throw new Error(`download failed: ${url}`);
  const { writeFileSync: writeFileSync19 } = await import("node:fs");
  writeFileSync19(dest, Buffer.from(await r2.arrayBuffer()));
}
async function sopsLinux() {
  const t2 = await latest("getsops/sops");
  mkdirSync6(BIN(), { recursive: true });
  await download(`https://github.com/getsops/sops/releases/download/${t2}/sops-${t2}.linux.${a64()}`, join10(BIN(), "sops"));
  chmodSync(join10(BIN(), "sops"), 493);
}
async function ageLinux() {
  const t2 = await latest("FiloSottile/age");
  const tmp = join10(home(), ".cache", "cs-age");
  mkdirSync6(tmp, { recursive: true });
  const tgz = join10(tmp, "age.tgz");
  await download(`https://github.com/FiloSottile/age/releases/download/${t2}/age-${t2}-linux-${a64()}.tar.gz`, tgz);
  await sh(`tar -xzf ${tgz} -C ${tmp}`);
  mkdirSync6(BIN(), { recursive: true });
  for (const n3 of ["age", "age-keygen"]) {
    copyFileSync3(join10(tmp, "age", n3), join10(BIN(), n3));
    chmodSync(join10(BIN(), n3), 493);
  }
  rmSync2(tmp, { recursive: true, force: true });
}
async function runDeps(install = false, compact = false) {
  const rows = [];
  let missingRequired = false;
  const apt = [];
  const present2 = [];
  const installed = [];
  const optional = [];
  for (const [name2, it] of Object.entries(CATALOG)) {
    let path = which(it.cmd);
    if (path) {
      rows.push([green("\u2713"), name2, dim(ver(it.ver).slice(0, 40))]);
      present2.push(name2);
      continue;
    }
    const inst = isMac() ? it.mac : it.linux;
    if (install && inst) {
      try {
        await spin(`installing ${name2}\u2026`, () => inst());
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
    step(`${present2.length + installed.length} tools ready${installed.length ? ` (installed ${installed.join(", ")})` : ""}`);
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
    BIN = () => join10(home(), ".local", "bin");
    ver = (args) => {
      const p = spawnSync2(args[0], args.slice(1), { encoding: "utf8", timeout: 1e4 });
      return ((p.stdout || p.stderr || "").split("\n")[0] ?? "").trim();
    };
    a64 = () => ["arm64", "aarch64"].includes(arch()) ? "arm64" : "amd64";
    sh = async (cmd) => {
      const { shell: shell2 } = await Promise.resolve().then(() => (init_proc(), proc_exports));
      const p = await shell2(cmd);
      if (p.code !== 0) throw new Error(`command failed: ${cmd}
${(p.err || p.out).split("\n").slice(-5).join("\n")}`);
    };
    brew = (pkg2) => () => sh(`brew install ${pkg2}`);
    CATALOG = {
      git: { cmd: "git", ver: ["git", "--version"], mac: brew("git"), required: true, apt: "git" },
      curl: { cmd: "curl", ver: ["curl", "--version"], required: true, apt: "curl" },
      ssh: { cmd: "ssh", ver: ["ssh", "-V"], required: true, apt: "openssh-client" },
      age: { cmd: "age", ver: ["age", "--version"], linux: ageLinux, mac: brew("age"), required: true },
      sops: { cmd: "sops", ver: ["sops", "--version"], linux: sopsLinux, mac: brew("sops"), required: true },
      node: { cmd: "node", ver: ["node", "--version"], required: true },
      gh: { cmd: "gh", ver: ["gh", "--version"], mac: brew("gh"), required: false, apt: "gh" },
      claude: { cmd: "claude", ver: ["claude", "--version"], linux: () => sh("curl -fsSL https://claude.ai/install.sh | bash"), mac: () => sh("curl -fsSL https://claude.ai/install.sh | bash"), required: true }
    };
  }
});

// src/env.ts
function classify(name2, git2, extraLocal = []) {
  if (git2.tracked) return "tracked";
  if (!git2.ignored) return "unignored";
  return name2.endsWith(".local") || extraLocal.includes(name2) ? "local" : "values";
}
function fileOf(project, entry) {
  if (entry === project) return ".env";
  return entry.startsWith(project + ".") && entry.length > project.length + 1 ? ".env." + entry.slice(project.length + 1) : void 0;
}
function merge3(base, local, stored, decide3 = {}) {
  const result = {}, toLocal = [], toStore = [], conflicts = [];
  const keys = /* @__PURE__ */ new Set([...Object.keys(base ?? {}), ...Object.keys(local), ...Object.keys(stored)]);
  const put2 = (k, v) => {
    if (v !== void 0) result[k] = v;
    if (v !== local[k]) toLocal.push(k);
    if (v !== stored[k]) toStore.push(k);
  };
  for (const k of keys) {
    const l2 = local[k], s = stored[k];
    if (l2 === s) {
      put2(k, l2);
      continue;
    }
    const localChanged = base ? l2 !== base[k] : l2 !== void 0, storedChanged = base ? s !== base[k] : s !== void 0;
    if (localChanged && storedChanged) {
      const side = decide3[k];
      if (side) put2(k, side === "local" ? l2 : s);
      else conflicts.push({ key: k, local: l2, stored: s });
      continue;
    }
    put2(k, localChanged ? l2 : s);
  }
  return { result, toLocal, toStore, conflicts };
}
function mergeKeys(base, local, stored, example) {
  const m = merge3(base && blank(base), blank(local), blank(stored));
  const result = {};
  for (const k of Object.keys(m.result)) result[k] = local[k] ?? example[k] ?? "";
  return { result, toLocal: m.toLocal, toStore: m.toStore, conflicts: [], toFill: Object.keys(result).filter((k) => result[k] === "") };
}
function patchDotenv(text3, values) {
  const seen = /* @__PURE__ */ new Set();
  const out2 = [];
  const lines = text3.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  for (const line of lines) {
    const m = line.match(/^(\s*(?:export\s+)?)([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);
    if (!m || seen.has(m[2])) {
      out2.push(line);
      continue;
    }
    const k = m[2];
    seen.add(k);
    if (!(k in values)) continue;
    const cur = parseValue2(m[3]);
    out2.push(cur === values[k] ? line : `${m[1]}${k}=${quote(values[k])}`);
  }
  for (const [k, v] of Object.entries(values)) if (!seen.has(k)) out2.push(`${k}=${quote(v)}`);
  return out2.length ? out2.join("\n") + "\n" : "";
}
function parseValue2(raw) {
  let v = raw.trim();
  if (v.length >= 2 && v[0] === '"' && v[v.length - 1] === '"') {
    try {
      return JSON.parse(v);
    } catch {
      return v.slice(1, -1);
    }
  }
  if (v.length >= 2 && v[0] === "'" && v[v.length - 1] === "'") return v.slice(1, -1);
  return v;
}
function describeMerge(m, from) {
  const n3 = (c2) => `${c2} key${c2 === 1 ? "" : "s"}`;
  const put2 = m.toStore.filter((k) => k in m.result).length, take = m.toLocal.filter((k) => k in m.result).length;
  return [
    put2 ? `store ${n3(put2)}` : "",
    m.toStore.length - put2 ? `drop ${n3(m.toStore.length - put2)} from the share` : "",
    take ? `take ${n3(take)}${from ? ` from ${from}` : ""}` : "",
    m.toLocal.length - take ? `drop ${n3(m.toLocal.length - take)} here` : "",
    m.conflicts.length ? `${n3(m.conflicts.length)} changed on both machines \u2014 asked next` : ""
  ].filter(Boolean).join(", ");
}
function describeKeys(m, from) {
  const n3 = (c2) => `${c2} key${c2 === 1 ? "" : "s"}`;
  const take = m.toLocal.filter((k) => k in m.result), fill = take.filter((k) => m.toFill.includes(k)).length;
  const put2 = m.toStore.filter((k) => k in m.result).length;
  return [
    put2 ? `store ${n3(put2)}` : "",
    m.toStore.length - put2 ? `drop ${n3(m.toStore.length - put2)} from the share` : "",
    take.length ? `take ${n3(take.length)}${from ? ` from ${from}` : ""}${fill ? ` (${fill} to fill in)` : ""}` : "",
    m.toLocal.length - take.length ? `drop ${n3(m.toLocal.length - take.length)} here` : ""
  ].filter(Boolean).join(", ");
}
var isEnvName, storeName, blank, quote;
var init_env = __esm({
  "src/env.ts"() {
    "use strict";
    isEnvName = (name2) => /^\.env(\..+)?$/.test(name2);
    storeName = (project, file) => file === ".env" ? project : `${project}.${file.slice(".env.".length)}`;
    blank = (v) => Object.fromEntries((Array.isArray(v) ? v : Object.keys(v)).map((k) => [k, ""]));
    quote = (v) => v === "" ? "" : /[ #"'\\$`]/.test(v) ? JSON.stringify(v) : v;
  }
});

// src/plan.ts
function ago(iso, now = Date.now()) {
  const t2 = Date.parse(iso);
  if (isNaN(t2)) return iso;
  const s = Math.max(0, (now - t2) / 1e3);
  return s < 90 ? "just now" : s < 3600 ? `${Math.round(s / 60)} min ago` : s < 86400 ? `${Math.round(s / 3600)} h ago` : `${Math.round(s / 86400)} d ago`;
}
function plan(facts, machine) {
  const actions = [], questions2 = [], skipped = [];
  for (const f of facts) {
    const name2 = f.checkout.project.name;
    handoffs(f, machine, actions, questions2, skipped);
    for (const e of f.env ?? []) {
      if (e.kind === "unignored") {
        skipped.push(`${name2}: ${e.file} is not gitignored \u2014 not carried (add it to .gitignore)`);
        continue;
      }
      if (e.kind !== "values") continue;
      if (!e.merge.toLocal.length && !e.merge.toStore.length && !e.merge.conflicts.length) continue;
      actions.push({ id: `env:${name2}:${e.file}`, kind: "env", checkout: f.checkout, env: e, label: `${name2} \xB7 ${e.file}`, hint: describeMerge(e.merge, e.storedFrom), checked: true });
      for (const c2 of e.merge.conflicts) questions2.push({
        kind: "env-key",
        env: e,
        key: c2.key,
        why: `${name2} \xB7 ${e.file}: ${c2.key} changed here and ${e.storedFrom ? `on ${e.storedFrom}` : "in the share"} since the last sync`
      });
    }
  }
  return { actions, questions: questions2, skipped };
}
function handoffs(f, machine, actions, questions2, skipped) {
  const c2 = f.checkout, name2 = c2.project.name;
  if (!enabled(c2.project)) {
    skipped.push(`${name2}: handoff disabled`);
    return;
  }
  if (f.offline) {
    skipped.push(`${name2}: remote unreachable \u2014 nothing sent or applied`);
    return;
  }
  const handled = /* @__PURE__ */ new Set();
  for (const w of f.waiting) {
    const target = c2.project.layout === "plain" ? c2.units[0] : c2.units.find((u5) => u5.branch === w.branch);
    if (c2.project.layout === "plain" && !target) continue;
    if (target && target.dirty) {
      if (w.machine === machine && target.branch === w.branch) continue;
      handled.add(w.branch);
      questions2.push({
        kind: "dirty-vs-waiting",
        checkout: c2,
        handoff: w,
        unit: target,
        sameBranch: target.branch === w.branch,
        why: `${name2}: a handoff from ${w.machine} (${when(w.when)}) is waiting for ${w.branch}, but ${target.rel === "." ? "the checkout" : target.rel}${target.branch === w.branch ? "" : ` (on ${target.branch})`} has ${count(target.dirty, "uncommitted change")}`
      });
      continue;
    }
    handled.add(w.branch);
    actions.push({
      id: `apply:${name2}:${w.branch}`,
      kind: "apply",
      checkout: c2,
      handoff: w,
      label: `${name2} \xB7 ${w.branch}`,
      hint: `from ${w.machine}, ${when(w.when)}${w.note ? " \u2014 " + w.note : ""}`,
      checked: true
    });
  }
  for (const u5 of c2.units) {
    if (u5.skip) {
      skipped.push(`${name2}${u5.rel === "." ? "" : "/" + u5.rel}: ${u5.skip}`);
      continue;
    }
    if (!u5.dirty && !u5.unpushed) continue;
    const label = `${name2} \xB7 ${u5.branch}`;
    const push4 = u5.unpushed ? { id: `push:${name2}:${u5.branch}`, kind: "push", checkout: c2, unit: u5, label, hint: `${count(u5.unpushed, "unpushed commit")} \u2192 upstream`, checked: false } : void 0;
    if (handled.has(u5.branch) || u5.secrets?.length) {
      if (u5.secrets?.length) skipped.push(`${label}: not sent \u2014 files that look secret: ${u5.secrets.join(", ")}  (cs handoff --allow <glob>)`);
      if (push4) actions.push(push4);
      continue;
    }
    const own = f.waiting.some((w) => w.branch === u5.branch && w.machine === machine);
    const bits = [u5.dirty ? count(u5.dirty, "change") : "", u5.unpushed ? count(u5.unpushed, "unpushed commit") : "", own ? "replaces the handoff sent from here earlier" : ""].filter(Boolean);
    actions.push({ id: `send:${name2}:${u5.branch}`, kind: "send", checkout: c2, unit: u5, label, hint: bits.join(", "), checked: true });
    if (push4) actions.push(push4);
  }
}
function status(f, machine) {
  const bits = [];
  let stuck = false;
  for (const u5 of f.checkout.units) {
    const at = u5.rel === "." ? "" : `${u5.rel}: `;
    const work = u5.dirty > 0 || u5.unpushed > 0;
    if (u5.dirty) bits.push({ kind: "dirty", text: `${at}${u5.dirty} dirty` });
    if (u5.unpushed) bits.push({ kind: "unpushed", text: `${at}\u2191${u5.unpushed} unpushed` });
    if (u5.skip) {
      bits.push({ kind: "skip", text: `${at}${u5.skip}${work ? " \u2014 not carried by cs sync: check a branch out" : ""}` });
      if (work) stuck = true;
    }
    if (u5.secrets?.length) {
      bits.push({ kind: "skip", text: `${at}not sent \u2014 files that look secret: ${u5.secrets.join(", ")} (cs handoff --allow <glob>)` });
      stuck = true;
    }
  }
  let keys = false;
  for (const e of f.env ?? []) {
    if (e.kind === "unignored") bits.push({ kind: "skip", text: `${e.file}: not gitignored \u2014 not carried (add it to .gitignore)` });
    else if (e.kind === "local") {
      const fill = toFill(e);
      const what = describeKeys({ ...e.merge, toFill: fill }, e.storedFrom);
      if (what) {
        bits.push({ kind: "env", text: `${e.file}: ${what}` });
        keys = true;
      }
      if (fill.length) bits.push({ kind: "env", text: `${e.file}: ${count(fill.length, "key")} to fill in (${fill.join(", ")})` });
    } else if (e.kind === "values") {
      const what = describeMerge(e.merge, e.storedFrom);
      if (what) bits.push({ kind: "env", text: `${e.file}: ${what}` });
    }
  }
  const here = f.checkout.units[0]?.branch;
  for (const w of f.waiting) bits.push({ kind: "waiting", text: `handoff waiting from ${w.machine}${w.branch === here ? "" : ` for ${w.branch}`} (${when(w.when)})` });
  if (f.offline) bits.push({ kind: "offline", text: "offline" });
  if (!enabled(f.checkout.project)) bits.push({ kind: "disabled", text: "handoff disabled" });
  const pl = plan([{ ...f, offline: false }], machine);
  return { bits, pending: pl.actions.length > 0 || pl.questions.length > 0 || keys, stuck };
}
var count, when, toFill;
var init_plan = __esm({
  "src/plan.ts"() {
    "use strict";
    init_checkout();
    init_env();
    count = (c2, one, many = one + "s") => `${c2} ${c2 === 1 ? one : many}`;
    when = (iso) => iso.slice(0, 16).replace("T", " ");
    toFill = (e) => "toFill" in e.merge ? e.merge.toFill : [];
  }
});

// src/note.ts
import { existsSync as existsSync7, mkdirSync as mkdirSync7, readdirSync as readdirSync3, readFileSync as readFileSync10, statSync as statSync5 } from "node:fs";
import { join as join11 } from "node:path";
function brief(input) {
  const i2 = input ?? {};
  const v = i2.command ?? i2.file_path ?? i2.path ?? i2.pattern ?? i2.query ?? i2.description ?? i2.url ?? i2.prompt ?? "";
  const s = (typeof v === "string" ? v : JSON.stringify(i2)).replace(/\s+/g, " ").trim();
  return s.length > 160 ? s.slice(0, 159) + "\u2026" : s;
}
function digest(jsonl, max = DIGEST_MAX) {
  const lines = [];
  const said = (who, text3) => {
    const t2 = clean(String(text3 ?? ""));
    if (t2 && !INJECTED.test(t2)) lines.push(`${who}: ${t2}`);
  };
  for (const raw of jsonl.split("\n")) {
    let d;
    try {
      d = JSON.parse(raw);
    } catch {
      continue;
    }
    if (d?.type !== "user" && d?.type !== "assistant" || d.isMeta || d.isSidechain) continue;
    const who = d.type === "user" ? "USER" : "CLAUDE";
    const c2 = d.message?.content;
    if (typeof c2 === "string") said(who, c2);
    else if (Array.isArray(c2)) for (const b of c2) {
      if (b?.type === "text") said(who, b.text);
      else if (b?.type === "tool_use") lines.push(`\u2192 ${b.name}: ${brief(b.input)}`);
    }
  }
  let out2 = lines.join("\n");
  if (out2.length > max) {
    const cut = out2.length - max, nl = out2.indexOf("\n", cut);
    out2 = "[earlier part of the session omitted]\n" + out2.slice(nl < 0 ? cut : nl + 1);
  }
  return out2;
}
function gitNote(f) {
  const head = [f.branch, f.changed.length ? count(f.changed.length, "changed file") : "clean tree", f.subject ? `last commit "${f.subject}"` : "", f.ended ? `session ended ${localTime(f.ended)}` : ""].filter(Boolean).join(" \xB7 ");
  const files = f.changed.length > FILES_SHOWN ? [...f.changed.slice(0, FILES_SHOWN), `\u2026 ${f.changed.length - FILES_SHOWN} more`].join(", ") : f.changed.join(", ");
  return [head, files, `no summary: ${f.why}`].filter(Boolean).join("\n");
}
function latestTranscript(paths) {
  let best;
  for (const p of new Set(paths)) {
    const dir = join11(claudeDir(), "projects", claudeProjectKey(p));
    if (!existsSync7(dir)) continue;
    for (const f of readdirSync3(dir)) {
      if (!f.endsWith(".jsonl")) continue;
      const mtime2 = statSync5(join11(dir, f)).mtimeMs;
      if (!best || mtime2 > best.mtime) best = { file: join11(dir, f), mtime: mtime2 };
    }
  }
  return best && { file: best.file, ended: new Date(best.mtime).toISOString() };
}
async function generate(unit, t2) {
  const changed = [...new Set([...out(["diff", "--name-only", "HEAD"], unit.path).split("\n"), ...out(["ls-files", "-o", "--exclude-standard"], unit.path).split("\n")].filter(Boolean))].sort();
  const facts = { branch: unit.branch, changed, subject: out(["log", "-1", "--format=%s"], unit.path), ended: t2?.ended, why: "" };
  const fallback = (why) => ({ note: gitNote({ ...facts, why }), source: "git" });
  if (!t2) return fallback("no session transcript for this project");
  if (process.env.CS_OFFLINE) return fallback("offline");
  if (!which("claude")) return fallback("claude not on PATH");
  const text3 = digest(readFileSync10(t2.file, "utf8"));
  if (!text3) return fallback("the session transcript is empty");
  const cap = noteTimeout();
  mkdirSync7(stateDir(), { recursive: true });
  const r2 = await exec2("claude", ["-p", "--no-session-persistence", "--output-format", "text", PROMPT], { input: text3, timeout: cap, group: true, cwd: stateDir() });
  if (r2.code === 124) return fallback(`claude took longer than ${cap} s`);
  const note3 = r2.out.trim();
  if (r2.code !== 0 || !note3) return fallback(`claude failed${r2.err ? " \u2014 " + r2.err.split("\n").filter(Boolean).pop() : ""}`);
  return { note: note3, source: "claude" };
}
async function pickNote(unit, c2, explicit, earlier) {
  if (explicit) return { note: explicit, source: "explicit" };
  const typed = earlier?.source === "explicit" && earlier.note ? earlier : void 0;
  const t2 = latestTranscript([unit.path]) ?? latestTranscript([.../* @__PURE__ */ new Set([c2.container, c2.root, ...c2.units.map((u5) => u5.path)])]);
  if (typed && !(t2 && t2.ended > typed.at)) return { note: typed.note, source: "explicit" };
  const g = await generate(unit, t2);
  return typed && g.source === "git" ? { note: typed.note, source: "explicit" } : g;
}
var PROMPT, DIGEST_MAX, FILES_SHOWN, noteTimeout, INJECTED, clean, localTime;
var init_note = __esm({
  "src/note.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_import();
    init_deps();
    init_proc();
    init_plan();
    PROMPT = "Below is a digest of a Claude Code session (USER / CLAUDE lines, \u2192 tool calls). The same person will resume this work on another machine. Write their handoff note: 2 to 6 short plain-text lines, no headings, no preamble, no markdown. First line: where this stopped, in one sentence. Then what is next, as concrete steps; name files, commands or failing tests only when they matter. If the digest is empty or says nothing about the work, reply with one line saying so.";
    DIGEST_MAX = 4e4;
    FILES_SHOWN = 8;
    noteTimeout = () => Math.max(1, parseInt(process.env.CS_NOTE_TIMEOUT ?? "", 10) || 60);
    INJECTED = /^<(local-command|command-|task-notification|system-reminder|ide_)/;
    clean = (t2) => t2.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "").trim();
    localTime = (iso) => {
      const d = new Date(iso);
      return when(new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString());
    };
  }
});

// src/checkout.ts
import { existsSync as existsSync8, mkdirSync as mkdirSync8, readFileSync as readFileSync11, rmSync as rmSync3, writeFileSync as writeFileSync7 } from "node:fs";
import { basename as basename3, join as join12, relative as relative4 } from "node:path";
import { userInfo } from "node:os";
function denyHits(unit, p, allow) {
  const changed = [...out(["ls-files", "-o", "--exclude-standard"], unit).split("\n"), ...out(["diff", "--name-only", "HEAD"], unit).split("\n")].filter(Boolean);
  const pats = [...DENY, ...hoff(p).never ?? []];
  return changed.filter((f) => pats.some((g) => globMatch(g, f) || globMatch(g, basename3(f))) && !allow.some((g) => globMatch(g, f)));
}
function locate(p, ws, o = {}) {
  const root = checkoutRoot(p, ws), cont = container(p, ws);
  if (!existsSync8(root)) return { project: p, root, why: "missing" };
  if (!isRepo(root)) return { project: p, root, why: "not a git repo" };
  if (!remoteUrl(root)) return { project: p, root, why: "no remote" };
  const units = dirsAt(root).filter((d) => isRepo(d)).map((path) => {
    const branch = currentBranch(path);
    const dirty = dirtyCount(path);
    const unpushed = aheadBehind(path)?.[0] ?? 0;
    const skip2 = !branch ? "detached HEAD" : branch.startsWith(`${REF_NS}/`) ? "on a handoff ref" : void 0;
    return { path, rel: relative4(cont, path) || ".", branch, dirty, unpushed, ...skip2 ? { skip: skip2 } : {}, ...dirty && !skip2 ? { secrets: denyHits(path, p, o.allow ?? []) } : {} };
  });
  return { project: p, root, container: cont, units };
}
function saveState(p, data) {
  mkdirSync8(handoffStateDir(), { recursive: true });
  writeFileSync7(stateFile(p), JSON.stringify(data, null, 2));
}
function loadState(p) {
  try {
    return JSON.parse(readFileSync11(stateFile(p), "utf8"));
  } catch {
    return void 0;
  }
}
async function fetchWaiting(c2, o = {}) {
  const user = userSlug(c2.root);
  const r2 = o.fetch !== false ? await gitA(["fetch", "-q", "--prune", "origin", refspec(user)], c2.root, { check: false, timeout: o.timeout ?? 60 }) : { code: 0 };
  const refs = out(["for-each-ref", "--format=%(refname:short) %(objectname)", `refs/remotes/origin/${REF_NS}/${user}/`], c2.root).split("\n").filter(Boolean);
  const list = refs.map((l2) => {
    const [full, sha] = l2.split(" ");
    const t2 = trailers(c2.root, sha);
    const ref = full.replace(/^origin\//, "");
    return { ref, sha, branch: t2["Cs-Branch"] ?? "", base: t2["Cs-Base"] ?? "", machine: t2["Cs-Machine"] ?? "?", worktree: t2["Cs-Worktree"] ?? ".", note: t2["Cs-Note"] ?? "", when: out(["log", "-1", "--format=%cI", sha], c2.root) };
  }).filter((x) => x.branch);
  return { ok: r2.code === 0, list };
}
async function buildSnapshot(unit, p, m, note3, extras, excludes, noteSource) {
  const idx = join12(commonDir(unit.path), `cs-handoff-index-${process.pid}`);
  const env2 = { GIT_INDEX_FILE: idx };
  try {
    git(["read-tree", "HEAD"], unit.path, { env: env2 });
    git(["add", "-A", "--", ".", ...excludes.map((e) => `:!${e}`)], unit.path, { env: env2 });
    const added = [];
    for (const g of extras) {
      const r2 = git(["add", "-f", "--", g], unit.path, { env: env2, check: false });
      if (r2.code === 0) added.push(g);
    }
    const putFile = (rel, content) => {
      const blob = git(["hash-object", "-w", "--stdin"], unit.path, { input: content }).out;
      git(["update-index", "--add", "--cacheinfo", `100644,${blob},${rel}`], unit.path, { env: env2 });
    };
    putFile(`${SIDE}/manifest.json`, JSON.stringify({ extras: added, machine: m.name, at: (/* @__PURE__ */ new Date()).toISOString(), ...note3 ? { noteSource } : {} }, null, 2) + "\n");
    if (note3) putFile(`${SIDE}/NOTE.md`, note3.trimEnd() + "\n");
    const tree = git(["write-tree"], unit.path, { env: env2 }).out;
    const files = out(["diff-tree", "-r", "--name-only", "HEAD", tree], unit.path).split("\n").filter((f) => f && !f.startsWith(SIDE)).length;
    const head = out(["rev-parse", "HEAD"], unit.path);
    const msg = [
      `handoff(${m.name}): ${unit.branch} @ ${head.slice(0, 7)} ${(/* @__PURE__ */ new Date()).toISOString()}`,
      "",
      `Cs-Base: ${head}`,
      `Cs-Branch: ${unit.branch}`,
      `Cs-Machine: ${m.name}`,
      `Cs-Worktree: ${unit.rel}`,
      ...note3 ? [`Cs-Note: ${note3.split("\n")[0].slice(0, 120)}`] : []
    ].join("\n");
    const sha = git(["commit-tree", tree, "-p", head, "-m", msg], unit.path, { env: { ...env2, GIT_AUTHOR_NAME: configGet(unit.path, "user.name") || "cs", GIT_AUTHOR_EMAIL: configGet(unit.path, "user.email") || "cs@localhost", GIT_COMMITTER_NAME: configGet(unit.path, "user.name") || "cs", GIT_COMMITTER_EMAIL: configGet(unit.path, "user.email") || "cs@localhost" } }).out;
    return { sha, files };
  } finally {
    rmSync3(idx, { force: true });
  }
}
function backupRef(unit, branch, sha) {
  const ref = `refs/cs/backup/${slug(branch)}/${Date.now()}`;
  git(["update-ref", ref, sha], unit);
  return ref;
}
async function backupAndReset(c2, m, path, label) {
  const branch = currentBranch(path) || "detached";
  const snap = await buildSnapshot({ path, branch, rel: relative4(c2.container, path) || ".", dirty: 0, unpushed: 0 }, c2.project, m, "", [], []);
  const ref = backupRef(path, branch, snap.sha);
  git(["reset", "-q", "--hard"], path);
  git(["clean", "-qfd"], path);
  step(`${label}: local changes backed up to ${ref}`);
  return ref;
}
async function send(c2, u5, m, o = {}) {
  const p = c2.project;
  const label = `${p.name}${u5.rel === "." ? "" : "/" + u5.rel}`;
  const hits = denyHits(u5.path, p, o.allow ?? []);
  if (hits.length) {
    fail(`${label}: refusing to hand off files that look secret: ${hits.join(", ")}  (--allow <glob> to override)`);
    return { ok: false };
  }
  const user = userSlug(u5.path);
  const ref = handoffRef(user, u5.branch);
  if (o.dryRun) {
    step(`${label}: would push ${dirtyCount(u5.path)} change(s) on ${u5.branch} \u2192 ${ref}`);
    return { ok: false };
  }
  await spin(`${label}: fetching ${ref}\u2026`, () => gitA(["fetch", "-q", "--prune", "origin", refspec(user)], u5.path, { check: false, timeout: 60 }));
  const lease = out(["rev-parse", "--verify", "-q", `refs/remotes/origin/${ref}`], u5.path);
  let earlier;
  if (lease) {
    const t2 = trailers(u5.path, lease);
    if (t2["Cs-Machine"] && t2["Cs-Machine"] !== m.name) {
      if (!o.over || o.over.sha !== lease) {
        fail(`${label}: a handoff from ${t2["Cs-Machine"]} is waiting on ${ref} \u2014 run cs resume there first, or --overwrite`);
        return { ok: false };
      }
      step(`${p.name} \xB7 ${u5.branch}: handoff from ${o.over.machine} backed up to ${backupRef(u5.path, u5.branch, o.over.sha)}`);
    }
    if (t2["Cs-Machine"] === m.name) {
      let mf = {};
      try {
        mf = JSON.parse(out(["show", `${lease}:${SIDE}/manifest.json`], u5.path));
      } catch {
      }
      earlier = { note: out(["show", `${lease}:${SIDE}/NOTE.md`], u5.path), source: mf.noteSource ?? "explicit", at: mf.at ?? "" };
    }
  }
  const { note: note3, source } = await spin(`${label}: writing the note\u2026`, () => pickNote(u5, c2, o.note, earlier));
  const { sha, files } = await spin(`${label}: snapshotting\u2026`, () => buildSnapshot(u5, p, m, note3, hoff(p).extra ?? [], hoff(p).exclude ?? [], source));
  git(["update-ref", `refs/heads/${ref}`, sha], u5.path);
  const push4 = await spin(`${label}: pushing ${ref}\u2026`, () => gitA(["push", "-q", `--force-with-lease=refs/heads/${ref}:${lease || ""}`, "origin", `refs/heads/${ref}:refs/heads/${ref}`], u5.path, { check: false, timeout: 120 }));
  git(["update-ref", "-d", `refs/heads/${ref}`], u5.path, { check: false });
  if (push4.code !== 0) {
    fail(`${label}: push rejected \u2014 ${push4.err.split("\n").pop()}`);
    return { ok: false };
  }
  saveState(p, { handedOff: [{ ref, sha, branch: u5.branch, worktree: u5.rel, at: (/* @__PURE__ */ new Date()).toISOString() }], machine: m.name });
  step(`${label}: ${u5.branch} \u2192 ${ref}  ${dim(`${files} file(s)${u5.unpushed ? ` + ${u5.unpushed} unpushed commit(s)` : ""}${NOTE_LABEL[source]}`)}`);
  return { ok: true, ref, files, unpushed: u5.unpushed };
}
async function landing(c2, m, h2, replace) {
  const p = c2.project, root = c2.root;
  const existing = c2.units.find((u5) => u5.branch === h2.branch);
  if (existing) return { path: existing.path, created: false };
  if (p.layout === "worktrees") {
    const dir = join12(c2.container, `wt-${slug(h2.branch)}`);
    const hasBranch = !!out(["rev-parse", "--verify", "-q", `refs/heads/${h2.branch}`], root);
    const r3 = git(["worktree", "add", "-q", ...hasBranch ? [dir, h2.branch] : ["-b", h2.branch, dir, h2.base]], root, { check: false });
    if (r3.code !== 0) {
      fail(`${p.name}: could not create worktree ${contract(dir)} \u2014 ${r3.err.split("\n").pop()}`);
      return void 0;
    }
    return { path: dir, created: true };
  }
  if (isDirty(root)) {
    if (!replace) {
      fail(`${p.name}: ${contract(root)} is dirty and on ${currentBranch(root)}; commit/stash or use --replace`);
      return void 0;
    }
    await backupAndReset(c2, m, root, `${p.name} \xB7 ${currentBranch(root)}`);
  }
  const r2 = git(["checkout", "-q", "-B", h2.branch, out(["rev-parse", "--verify", "-q", `refs/heads/${h2.branch}`], root) || h2.base], root, { check: false });
  if (r2.code !== 0) {
    fail(`${p.name}: checkout ${h2.branch} failed \u2014 ${r2.err.split("\n").pop()}`);
    return void 0;
  }
  return { path: root, created: false };
}
async function apply(c2, h2, m, o = {}) {
  const p = c2.project;
  const label = `${p.name} \xB7 ${h2.branch}`;
  if (o.dryRun) {
    step(`${label}: handoff from ${h2.machine} (${h2.when.slice(0, 16)})${h2.note ? " \u2014 " + h2.note : ""}`);
    return { ok: false };
  }
  const unit = await landing(c2, m, h2, !!o.replace);
  if (!unit) return { ok: false };
  if (isDirty(unit.path)) {
    if (!o.replace) {
      fail(`${label}: ${contract(unit.path)} has uncommitted changes \u2014 commit them, or --replace (keeps a backup ref)`);
      return { ok: false };
    }
    await backupAndReset(c2, m, unit.path, label);
  }
  const ff = git(["merge", "-q", "--ff-only", h2.base], unit.path, { check: false });
  if (ff.code !== 0) {
    fail(`${label}: branch diverged from the handoff's base ${h2.base.slice(0, 7)} \u2014 merge/rebase manually, then re-run`);
    return { ok: false };
  }
  const cp = git(["cherry-pick", "-n", "--allow-empty", h2.sha], unit.path, { check: false });
  if (cp.code !== 0) {
    git(["cherry-pick", "--abort"], unit.path, { check: false });
    git(["reset", "-q", "--hard"], unit.path);
    fail(`${label}: could not apply handoff \u2014 ${cp.err.split("\n").pop()}`);
    return { ok: false };
  }
  git(["reset", "-q"], unit.path);
  let extras = [];
  try {
    extras = JSON.parse(readFileSync11(join12(unit.path, SIDE, "manifest.json"), "utf8")).extras ?? [];
  } catch {
  }
  for (const e of extras) git(["rm", "-rq", "--cached", "--", e], unit.path, { check: false });
  let note3 = "";
  try {
    note3 = readFileSync11(join12(unit.path, SIDE, "NOTE.md"), "utf8");
  } catch {
  }
  rmSync3(join12(unit.path, SIDE), { recursive: true, force: true });
  if (!o.keepRemote) {
    await spin(`${label}: removing ${h2.ref} from origin\u2026`, () => gitA(["push", "-q", "origin", "--delete", h2.ref], unit.path, { check: false, timeout: 60 }));
    git(["update-ref", "-d", `refs/remotes/origin/${h2.ref}`], unit.path, { check: false });
  }
  if (note3) {
    mkdirSync8(handoffStateDir(), { recursive: true });
    writeFileSync7(noteFile(p), note3);
  }
  saveState(p, { resumed: { branch: h2.branch, from: h2.machine, at: (/* @__PURE__ */ new Date()).toISOString(), path: unit.path } });
  step(`${label}: restored in ${contract(unit.path)}${unit.created ? dim(" (worktree created)") : ""}  ${dim(`${dirtyCount(unit.path)} change(s) from ${h2.machine}`)}`);
  return { ok: true, path: unit.path, created: unit.created, note: note3 };
}
async function push(c2, u5) {
  const label = `${c2.project.name} \xB7 ${u5.branch}`;
  const up = upstream(u5.path, u5.branch);
  if (!up) {
    fail(`${label}: no upstream configured \u2014 not pushed`);
    return { ok: false };
  }
  const r2 = await spin(`${label}: pushing\u2026`, () => gitA(["push", "-q", up.remote, `refs/heads/${u5.branch}:${up.ref}`], u5.path, { check: false, timeout: 120 }));
  if (r2.code !== 0) {
    fail(`${label}: push rejected \u2014 ${r2.err.split("\n").pop()}`);
    return { ok: false };
  }
  const to = `${up.remote}/${up.ref.replace(/^refs\/heads\//, "")}`;
  step(`${label} \u2192 ${to}`);
  return { ok: true, to };
}
var DENY, SIDE, NOTE_LABEL, REF_NS, container, checkoutRoot, sniff, hoff, enabled, dirsAt, dirs, present, userSlug, handoffRef, refspec, stateFile, noteFile;
var init_checkout = __esm({
  "src/checkout.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_manifest();
    init_note();
    init_ui();
    DENY = ["**/.env", "**/.env.*", "**/*.pem", "**/*.key", "**/*token*", "**/*secret*"];
    SIDE = ".cs-handoff";
    NOTE_LABEL = { explicit: " \xB7 note", claude: " \xB7 note (claude)", git: " \xB7 note (git-derived)" };
    REF_NS = "handoff";
    container = (p, ws) => join12(ws, p.path || p.name);
    checkoutRoot = (p, ws) => p.layout === "worktrees" ? join12(container(p, ws), "repo") : container(p, ws);
    sniff = (dir) => existsSync8(join12(dir, "repo", ".git")) ? { root: join12(dir, "repo"), layout: "worktrees" } : { root: dir, layout: "plain" };
    hoff = (p) => p.handoff ?? {};
    enabled = (p) => p.handoff !== false && hoff(p).enabled !== false;
    dirsAt = (root) => !existsSync8(root) ? [] : !isRepo(root) ? [root] : worktrees(root).length ? worktrees(root) : [root];
    dirs = (p, ws) => dirsAt(checkoutRoot(p, ws));
    present = (c2) => "units" in c2;
    userSlug = (p) => slug(configGet(p, "user.name") || userInfo().username);
    handoffRef = (user, branch) => `${REF_NS}/${user}/${slug(branch)}`;
    refspec = (user) => `+refs/heads/${REF_NS}/${user}/*:refs/remotes/origin/${REF_NS}/${user}/*`;
    stateFile = (p) => join12(handoffStateDir(), `${p.name}.json`);
    noteFile = (p) => join12(handoffStateDir(), `${p.name}.note`);
  }
});

// src/projectstate.ts
var projectstate_exports = {};
__export(projectstate_exports, {
  decide: () => decide,
  forget: () => forget,
  memoryDir: () => memoryDir,
  observe: () => observe,
  place: () => place,
  placeAll: () => placeAll,
  projectState: () => projectState,
  statesDir: () => statesDir,
  stripped: () => stripped,
  sweep: () => sweep,
  write: () => write
});
import { existsSync as existsSync9, mkdirSync as mkdirSync9, readdirSync as readdirSync4, readFileSync as readFileSync12, renameSync as renameSync2, rmSync as rmSync4, statSync as statSync6, unlinkSync as unlinkSync3, utimesSync, writeFileSync as writeFileSync8 } from "node:fs";
import { dirname as dirname4, join as join13, relative as relative5 } from "node:path";
function walk(dir, fn, skipDir, base = dir) {
  if (!existsSync9(dir)) return;
  for (const e of readdirSync4(dir, { withFileTypes: true })) {
    const f = join13(dir, e.name);
    const rel = relative5(base, f);
    if (e.isDirectory()) {
      if (!skipDir?.(rel)) walk(f, fn, skipDir, base);
    } else if (e.isFile()) fn(rel);
  }
}
function managedRels(base) {
  const rels = /* @__PURE__ */ new Set();
  for (const f of ROOT_FILES) if (existsSync9(join13(base, f)) && statSync6(join13(base, f)).isFile()) rels.add(f);
  walk(join13(base, ".claude"), (rel) => {
    if (rel !== "settings.json") rels.add(".claude/" + rel);
  }, (rel) => SKIP_UNDER_CLAUDE.has(rel.split("/")[0]));
  return rels;
}
function stateRels(state) {
  const rels = /* @__PURE__ */ new Set();
  walk(state, (rel) => rels.add(rel), (rel) => NOT_SYNCED.has(rel.split("/")[0]));
  return rels;
}
function withoutPointer(raw) {
  let d;
  try {
    d = JSON.parse(raw.toString("utf8") || "{}");
  } catch {
    return void 0;
  }
  if (!d || typeof d !== "object") return void 0;
  const rest = d;
  const had = POINTER in rest;
  delete rest[POINTER];
  return { rest, had };
}
function normalize(rel, data) {
  if (rel !== SETTINGS_LOCAL) return data;
  const w = withoutPointer(data);
  return w ? Buffer.from(Object.keys(w.rest).length ? dumps(w.rest) : "") : data;
}
function localize(rel, data, pointer) {
  if (rel !== SETTINGS_LOCAL) return data;
  let d = {};
  try {
    d = data.toString("utf8").trim() ? JSON.parse(data.toString("utf8")) : {};
  } catch {
  }
  d[POINTER] = pointer;
  return Buffer.from(dumps(d));
}
function observe(state, targets, remembered, pointer) {
  const stampOf2 = (f, rel) => {
    const raw = readFileSync12(f);
    return { data: normalize(rel, raw), raw, mtime: statSync6(f).mtimeMs / 1e3 };
  };
  const o = { state: {}, targets: {}, remembered: [...remembered], pointer, excludes: [] };
  for (const rel of stateRels(state)) {
    const { data, mtime: mtime2 } = stampOf2(join13(state, rel), rel);
    o.state[rel] = { data, mtime: mtime2 };
  }
  const seen = /* @__PURE__ */ new Set();
  for (const t2 of targets) {
    o.targets[t2] = {};
    for (const rel of /* @__PURE__ */ new Set([...managedRels(t2), ...Object.keys(o.state)])) {
      const f = join13(t2, rel);
      if (existsSync9(f) && statSync6(f).isFile()) o.targets[t2][rel] = stampOf2(f, rel);
    }
    if (!isRepo(t2)) continue;
    const file = infoExclude(t2);
    if (seen.has(file)) continue;
    seen.add(file);
    o.excludes.push({ file, target: t2, text: existsSync9(file) ? readFileSync12(file, "utf8") : "" });
  }
  return o;
}
function decide(o) {
  const d = { toState: [], toTargets: [], removals: [], excludes: [], placed: [] };
  const targets = Object.keys(o.targets);
  const remembered = new Set(o.remembered);
  const rels = /* @__PURE__ */ new Set([...Object.keys(o.state), SETTINGS_LOCAL]);
  for (const t2 of targets) for (const rel of Object.keys(o.targets[t2])) rels.add(rel);
  for (const rel of [...rels].sort()) {
    const state = o.state[rel];
    let best = state?.data, mtime2 = state?.mtime ?? -1, from = "";
    for (const t2 of targets) {
      const s = o.targets[t2][rel];
      if (s && (!best || !s.data.equals(best)) && s.mtime > mtime2 + 1e-6) {
        best = s.data;
        mtime2 = s.mtime;
        from = t2;
      }
    }
    if (!state && remembered.has(rel) && rel !== SETTINGS_LOCAL) {
      for (const t2 of targets) if (o.targets[t2][rel]) d.removals.push({ target: t2, rel });
      continue;
    }
    if (!best) {
      if (rel !== SETTINGS_LOCAL) continue;
      best = Buffer.alloc(0);
    }
    const substantive = best.length > 0 || rel !== SETTINGS_LOCAL;
    if (substantive && (!state || !best.equals(state.data))) d.toState.push({ rel, data: best, mtime: mtime2, from });
    if (substantive) d.placed.push(rel);
    const want = localize(rel, best, o.pointer);
    for (const t2 of targets) {
      const have = o.targets[t2][rel]?.raw;
      if (!have || !have.equals(want)) d.toTargets.push({ target: t2, rel, data: want, mtime: mtime2 });
    }
  }
  for (const e of o.excludes) {
    const missing = EXCLUDE_LINES.filter((l2) => !e.text.split("\n").includes(l2));
    if (!missing.length) continue;
    d.excludes.push({ file: e.file, target: e.target, missing, text: e.text + (!e.text || e.text.endsWith("\n") ? "" : "\n") + "# claude-share managed files\n" + missing.join("\n") + "\n" });
  }
  return d;
}
function put(path, data, mtime2) {
  mkdirSync9(dirname4(path), { recursive: true });
  const tmp = path + ".cs-tmp";
  writeFileSync8(tmp, data);
  if (mtime2 > 0) utimesSync(tmp, mtime2, mtime2);
  renameSync2(tmp, path);
}
function write(state, memory, d, check = false) {
  const lines = [];
  if (!check && !existsSync9(memory)) mkdirSync9(memory, { recursive: true });
  const rels = [...new Set([...d.removals, ...d.toState, ...d.toTargets].map((x) => x.rel))].sort();
  for (const rel of rels) {
    for (const r2 of d.removals) if (r2.rel === rel) {
      lines.push(`remove ${rel} from ${contract(r2.target)} (deleted in project state)`);
      if (!check) unlinkSync3(join13(r2.target, rel));
    }
    for (const s of d.toState) if (s.rel === rel) {
      lines.push(`project state \u2190 ${rel} (from ${contract(s.from)})`);
      if (!check) put(join13(state, rel), s.data, s.mtime);
    }
    for (const t2 of d.toTargets) if (t2.rel === rel) {
      lines.push(`${contract(t2.target)}/${rel} \u2190 project state`);
      if (!check) put(join13(t2.target, rel), t2.data, t2.mtime);
    }
  }
  for (const e of d.excludes) {
    lines.push(`exclude ${e.missing.join(", ")} in ${contract(e.target)}`);
    if (!check) {
      mkdirSync9(dirname4(e.file), { recursive: true });
      writeFileSync8(e.file, e.text);
    }
  }
  return lines;
}
function loadRecord(name2) {
  try {
    const r2 = JSON.parse(readFileSync12(recordFile(name2), "utf8"));
    return { root: r2.root, files: r2.files ?? [] };
  } catch {
    return { files: [] };
  }
}
function saveRecord(name2, root, files) {
  mkdirSync9(recordsDir(), { recursive: true });
  writeFileSync8(recordFile(name2), JSON.stringify({ root, files: [...files].sort() }, null, 2));
}
function stripped(raw) {
  const w = raw && withoutPointer(raw);
  if (!w?.had) return void 0;
  return Object.keys(w.rest).length ? Buffer.from(dumps(w.rest)) : null;
}
function unplace(name2, units, why, check) {
  const lines = [];
  for (const c2 of units) {
    const f = join13(c2, SETTINGS_LOCAL);
    const next = stripped(existsSync9(f) ? readFileSync12(f) : void 0);
    if (next === void 0) continue;
    lines.push(`${name2}: auto-memory pointer removed from ${contract(c2)}${why}`);
    if (check) continue;
    next === null ? unlinkSync3(f) : writeFileSync8(f, next);
  }
  if (!check) rmSync4(recordFile(name2), { force: true });
  return lines;
}
function place(share, p, o = {}) {
  const ws = workspace2(share);
  const targets = dirs(p, ws);
  if (!targets.length) return [];
  const state = projectState(share, p.name), memory = memoryDir(share, p.name);
  const d = decide(observe(state, targets, loadRecord(p.name).files, contract(memory)));
  const lines = write(state, memory, d, o.check);
  if (!o.check) saveRecord(p.name, checkoutRoot(p, ws), d.placed);
  return lines;
}
function placeAll(share, o = {}) {
  const names = o.names ?? [];
  const unknown = names.filter((n3) => !share.manifest.projects[n3]);
  if (unknown.length) throw new Error(`cs: unknown project(s): ${unknown.join(", ")}`);
  const lines = names.length ? [] : sweep(share, { check: o.check });
  for (const p of selectedProjects2(share)) if (!names.length || names.includes(p.name)) for (const l2 of place(share, p, o)) lines.push(`${p.name}: ${l2}`);
  return lines;
}
function sweep(share, o = {}) {
  const lines = [];
  const ws = workspace2(share);
  for (const name2 of records()) {
    if (share.manifest.projects[name2]) continue;
    const root = loadRecord(name2).root || sniff(join13(ws, name2)).root;
    lines.push(...unplace(name2, dirsAt(root), " (project removed from the share)", o.check ?? false));
  }
  return lines;
}
var ROOT_FILES, SKIP_UNDER_CLAUDE, EXCLUDE_LINES, SETTINGS_LOCAL, NOT_SYNCED, POINTER, statesDir, projectState, memoryDir, recordsDir, recordFile, records, forget;
var init_projectstate = __esm({
  "src/projectstate.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_share();
    init_checkout();
    init_jsonmerge();
    ROOT_FILES = ["CLAUDE.md", "CLAUDE.local.md", ".mcp.json"];
    SKIP_UNDER_CLAUDE = /* @__PURE__ */ new Set(["worktrees", "plans", "settings.json"]);
    EXCLUDE_LINES = [".claude/", ".mcp.json", "CLAUDE.md", "CLAUDE.local.md"];
    SETTINGS_LOCAL = ".claude/settings.local.json";
    NOT_SYNCED = /* @__PURE__ */ new Set(["memory", "secrets"]);
    POINTER = "autoMemoryDirectory";
    statesDir = (share) => join13(share.path, "projects");
    projectState = (share, name2) => join13(statesDir(share), name2);
    memoryDir = (share, name2) => join13(projectState(share, name2), "memory");
    recordsDir = () => join13(stateDir(), "project-state");
    recordFile = (name2) => join13(recordsDir(), `${name2}.json`);
    records = () => existsSync9(recordsDir()) ? readdirSync4(recordsDir()).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)) : [];
    forget = (name2, units) => unplace(name2, units, "", false);
  }
});

// src/sharesync.ts
var sharesync_exports = {};
__export(sharesync_exports, {
  describe: () => describe2,
  lastSync: () => lastSync,
  lastSyncFile: () => lastSyncFile,
  newest: () => newest,
  runShareSync: () => runShareSync,
  shareGitSync: () => shareGitSync
});
import { existsSync as existsSync10, mkdirSync as mkdirSync10, readFileSync as readFileSync13, rmSync as rmSync5, statSync as statSync7, writeFileSync as writeFileSync9 } from "node:fs";
import { join as join14 } from "node:path";
function conflictsOf(repo, local, upstream2) {
  const change = (tip, file) => ({ when: out(["log", "-1", "--format=%cI", tip, "--", file], repo), deleted: !out(["ls-tree", tip, "--", file], repo) });
  return out(["diff", "--name-only", "--diff-filter=U"], repo).split("\n").filter(Boolean).map((file) => ({ file, ours: change(local, file), theirs: change(upstream2, file) }));
}
function takeSide(repo, file, side) {
  const stages = out(["ls-files", "-u", "--", file], repo).split("\n").filter(Boolean).map((l2) => l2.split(/\s+/)[2]);
  if (!stages.includes(side === "ours" ? "3" : "2")) {
    git(["rm", "-q", "--cached", "--", file], repo, { check: false });
    rmSync5(join14(repo, file), { force: true });
    return;
  }
  git(["checkout", side === "ours" ? "--theirs" : "--ours", "--", file], repo);
  git(["add", "--", file], repo);
}
function settleRebase(repo, label, local, upstream2, o) {
  const env2 = { GIT_EDITOR: "true" };
  const ident2 = identityArgs(repo);
  const settled = [];
  let backedUp = false;
  let last = "";
  const abort = () => git(["rebase", "--abort"], repo, { check: false });
  try {
    while (rebaseInProgress(repo)) {
      const stops = conflictsOf(repo, local, upstream2);
      const step2 = rebaseStep(repo);
      if (!stops.length) throw new Error(`cs: share rebase stopped without a conflict \u2014 cd ${contract(repo)} && git rebase origin/${currentBranch(repo)}`);
      if (step2 === last) throw new Error(`cs: share rebase keeps stopping on ${stops.map((c2) => c2.file).join(", ")} \u2014 cd ${contract(repo)} && git rebase origin/${currentBranch(repo)}`);
      last = step2;
      const open2 = stops.filter((c2) => !decide2(c2, o.resolve));
      if (open2.length && o.ask) {
        abort();
        return open2;
      }
      if (!backedUp) {
        git(["update-ref", `refs/cs/backup/share/${Date.now()}`, local], repo);
        backedUp = true;
      }
      for (const c2 of stops) {
        const side = decide2(c2, o.resolve) ?? newest(c2);
        takeSide(repo, c2.file, side);
        settled.push(`${c2.file} (${side === "ours" ? "this machine" : "the other machine"})`);
      }
      const empty = git(["diff", "--cached", "--quiet"], repo, { check: false }).code === 0;
      const r2 = git([...ident2, "rebase", empty ? "--skip" : "--continue"], repo, { check: false, env: env2 });
      if (r2.code !== 0 && !rebaseInProgress(repo)) throw new Error(`cs: share rebase failed \u2014 ${r2.err.split("\n").pop()}`);
    }
  } catch (e) {
    if (rebaseInProgress(repo)) abort();
    throw e;
  }
  step(`${label}: settled ${settled.join(", ")}`);
  return void 0;
}
async function shareGitSync(share, label, o = {}) {
  const repo = share.path;
  if (!isRepo(repo)) {
    warn(`${label}: not a git repo (${contract(repo)})`);
    return { ok: false };
  }
  const timeout = o.timeout ?? 20;
  const release = acquire();
  if (!release) {
    info(`${label}: another sync is running, skipping`);
    return { ok: true };
  }
  try {
    if (rebaseInProgress(repo)) {
      error(`${label}: a rebase is in progress in ${contract(repo)}`, "", "finish it: git rebase --continue \xB7 or drop it: git rebase --abort");
      return { ok: false };
    }
    if (!o.pullOnly && isDirty(repo)) {
      const n3 = dirtyCount(repo);
      commit2(share, `sync(${share.machine.name}): ${n3} file(s) ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 16).replace("T", " ")}`);
      step(`${label}: committed ${n3} change(s)`);
    }
    if (!remoteUrl(repo)) {
      ok(`${label}: no remote configured; local only`);
      return { ok: true };
    }
    if (o.commitOnly) return { ok: true, offline: true };
    const f = await spin(`${label}: fetching\u2026`, () => gitA(["fetch", "-q", "--prune", "origin"], repo, { check: false, timeout }));
    if (f.code !== 0) {
      warn(`${label}: offline or fetch timed out; will push later`);
      markSync("offline");
      return { ok: true, offline: true };
    }
    const branch = currentBranch(repo);
    if (!branch) {
      fail(`${label}: detached HEAD; refusing to sync`);
      return { ok: false };
    }
    if (!out(["rev-parse", "--abbrev-ref", "@{upstream}"], repo)) {
      if (out(["rev-parse", "--verify", "-q", `origin/${branch}`], repo)) git(["branch", "-q", `--set-upstream-to=origin/${branch}`, branch], repo);
      else if (!o.pullOnly) {
        await spin(`${label}: pushing\u2026`, () => gitA(["push", "-q", "-u", "origin", branch], repo, { timeout }));
        ok(`${label}: pushed new branch ${branch}`);
        return { ok: true, pushed: 1 };
      } else return { ok: true };
    }
    let [ahead, behind] = aheadBehind(repo) ?? [0, 0];
    if (behind && !o.pushOnly) {
      if (!ahead) {
        git(["merge", "-q", "--ff-only", "@{upstream}"], repo);
        step(`${label}: fast-forwarded ${behind} commit(s)`);
      } else {
        const local = out(["rev-parse", "HEAD"], repo), upstream2 = out(["rev-parse", "@{upstream}"], repo);
        const r2 = git([...identityArgs(repo), "rebase", "-q", "@{upstream}"], repo, { check: false, env: { GIT_EDITOR: "true" } });
        if (r2.code !== 0) {
          let open2;
          try {
            open2 = settleRebase(repo, label, local, upstream2, o);
          } catch (e) {
            error(`${label}: could not settle the rebase`, e.message.replace(/^cs: /, ""));
            return { ok: false };
          }
          if (open2) {
            step(`${label}: ${open2.length} file(s) changed on both machines \u2014 asking`);
            return { ok: false, conflicts: open2 };
          }
        }
        step(`${label}: rebased ${ahead} local commit(s) onto ${behind} remote commit(s)`);
      }
    }
    let pushed = 0;
    if (!o.pullOnly) {
      const ab = aheadBehind(repo);
      if (ab && ab[0]) {
        const pr = await spin(`${label}: pushing\u2026`, () => gitA(["push", "-q", "origin", branch], repo, { check: false, timeout }));
        if (pr.code !== 0) {
          warn(`${label}: push rejected, retrying once`);
          release();
          return shareGitSync(share, label, o);
        }
        pushed = ab[0];
        ok(`${label}: pushed ${ab[0]} commit(s)`);
      }
    }
    markSync((/* @__PURE__ */ new Date()).toISOString());
    return { ok: true, pushed };
  } finally {
    release();
  }
}
async function runShareSync(share, o = {}) {
  const repo = share.path;
  let rc = 0;
  if (o.debounce && existsSync10(lastSyncFile()) && Date.now() - statSync7(lastSyncFile()).mtimeMs < o.debounce * 1e3) return 0;
  const before = out(["rev-parse", "HEAD"], repo);
  if (!o.pullOnly) placeAll(share);
  if (!(await shareGitSync(share, "share", { ...o, resolve: o.resolve ?? "newest", ask: false })).ok) rc = 2;
  const after = out(["rev-parse", "HEAD"], repo);
  if (after !== before || o.pullOnly) {
    const changed = before ? out(["diff", "--name-only", before, after], repo) : "";
    if (o.pullOnly || changed.split("\n").some((x) => x.startsWith("claude/") || x.startsWith("projects.toml") || x.startsWith("plans/"))) runApply(reload(share));
    placeAll(reload(share));
  }
  return rc;
}
var lastSyncFile, lastSync, markSync, newest, describe2, decide2;
var init_sharesync = __esm({
  "src/sharesync.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_lock();
    init_share();
    init_apply();
    init_projectstate();
    init_ui();
    lastSyncFile = () => join14(stateDir(), "last-sync");
    lastSync = () => existsSync10(lastSyncFile()) ? readFileSync13(lastSyncFile(), "utf8").trim() : void 0;
    markSync = (what) => {
      mkdirSync10(stateDir(), { recursive: true });
      writeFileSync9(lastSyncFile(), what + "\n");
    };
    newest = (c2) => Date.parse(c2.theirs.when) > Date.parse(c2.ours.when) ? "theirs" : "ours";
    describe2 = (ch) => `${ch.deleted ? "deleted" : "changed"} ${ch.when.slice(0, 16).replace("T", " ")}`;
    decide2 = (c2, r2) => r2 === void 0 ? void 0 : r2 === "newest" ? newest(c2) : typeof r2 === "string" ? r2 : r2[c2.file];
  }
});

// src/hooks.ts
var hooks_exports = {};
__export(hooks_exports, {
  HOOK_EVENTS: () => HOOK_EVENTS,
  hooksStatus: () => hooksStatus,
  installHooks: () => installHooks,
  installTimer: () => installTimer,
  runHooks: () => runHooks
});
import { existsSync as existsSync11, mkdirSync as mkdirSync11, readFileSync as readFileSync14, unlinkSync as unlinkSync4, writeFileSync as writeFileSync10 } from "node:fs";
import { join as join15 } from "node:path";
import { spawnSync as spawnSync3 } from "node:child_process";
function installHooks(share, remove2 = false) {
  const f = join15(share.path, "claude", "settings.base.json");
  const data = existsSync11(f) ? loads(readFileSync14(f, "utf8")) : {};
  data.hooks ??= {};
  let changed = false;
  const want = entries();
  for (const ev of /* @__PURE__ */ new Set([...Object.keys(want), ...Object.keys(data.hooks)])) {
    const cur = (data.hooks[ev] ?? []).filter((e) => !ours(e));
    const next = remove2 ? cur : [...cur, ...want[ev] ?? []];
    if (JSON.stringify(next) !== JSON.stringify(data.hooks[ev] ?? [])) {
      data.hooks[ev] = next;
      changed = true;
    }
    if (!data.hooks[ev]?.length) delete data.hooks[ev];
  }
  if (!Object.keys(data.hooks).length) delete data.hooks;
  if (changed) {
    writeFileSync10(f, dumps(data));
    commit2(share, `claude: ${remove2 ? "remove" : "install"} cs share-sync hooks`, [f]);
  }
  return changed;
}
async function installTimer(remove2 = false) {
  mkdirSync11(stateDir(), { recursive: true });
  const log2 = join15(stateDir(), "timer.log");
  if (isMac()) {
    const plist = join15(home(), "Library", "LaunchAgents", "dev.claude-share.sync.plist");
    if (remove2) {
      await exec2("launchctl", ["unload", plist]);
      if (existsSync11(plist)) unlinkSync4(plist);
      return "launchd agent removed";
    }
    mkdirSync11(join15(home(), "Library", "LaunchAgents"), { recursive: true });
    writeFileSync10(plist, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>dev.claude-share.sync</string>
<key>ProgramArguments</key><array><string>/bin/sh</string><string>-lc</string><string>cs share-sync --quiet</string></array>
<key>StartInterval</key><integer>900</integer>
<key>StandardOutPath</key><string>${log2}</string>
<key>StandardErrorPath</key><string>${log2}</string>
</dict></plist>
`);
    await exec2("launchctl", ["unload", plist]);
    const p = await exec2("launchctl", ["load", plist]);
    return "launchd agent every 15 min" + (p.code === 0 ? "" : ` (load failed: ${p.err})`);
  }
  const d = join15(home(), ".config", "systemd", "user");
  const svc = join15(d, "cs-sync.service"), tmr = join15(d, "cs-sync.timer");
  if (remove2) {
    await exec2("systemctl", ["--user", "disable", "--now", "cs-sync.timer"]);
    for (const f of [svc, tmr]) if (existsSync11(f)) unlinkSync4(f);
    return "systemd timer removed";
  }
  mkdirSync11(d, { recursive: true });
  writeFileSync10(svc, `[Unit]
Description=claude-share sync

[Service]
Type=oneshot
ExecStart=/bin/sh -lc 'cs share-sync --quiet'
StandardOutput=append:${log2}
StandardError=append:${log2}
`);
  writeFileSync10(tmr, "[Unit]\nDescription=claude-share sync every 15 min\n\n[Timer]\nOnBootSec=2min\nOnUnitActiveSec=15min\nPersistent=true\n\n[Install]\nWantedBy=timers.target\n");
  const r2 = await exec2("systemctl", ["--user", "daemon-reload"]);
  if (r2.code !== 0) return `systemd --user unavailable (${r2.err}); timer files written, not enabled`;
  const e = await exec2("systemctl", ["--user", "enable", "--now", "cs-sync.timer"]);
  return "systemd user timer every 15 min" + (e.code === 0 ? "" : ` (enable failed: ${e.err})`);
}
function hooksStatus(repo) {
  const f = join15(repo, "claude", "settings.base.json");
  const data = existsSync11(f) ? loads(readFileSync14(f, "utf8")) : {};
  const want = entries();
  const events = Object.keys(data.hooks ?? {}).filter((ev) => (data.hooks?.[ev] ?? []).some(ours));
  const complete = [.../* @__PURE__ */ new Set([...Object.keys(want), ...events])].every((ev) => JSON.stringify((data.hooks?.[ev] ?? []).filter(ours)) === JSON.stringify(want[ev] ?? []));
  const timerFiles = isMac() ? existsSync11(join15(home(), "Library", "LaunchAgents", "dev.claude-share.sync.plist")) : existsSync11(join15(home(), ".config", "systemd", "user", "cs-sync.timer"));
  const state = isMac() ? "" : spawnSync3("systemctl", ["--user", "is-active", "cs-sync.timer"], { encoding: "utf8" }).stdout?.trim() ?? "";
  const timerActive = isMac() ? timerFiles : state === "active";
  const timerSupported = isMac() || state !== "";
  return { events, complete, timerActive, timerFiles, timerSupported, lastSync: lastSync() };
}
async function runHooks(share, action, timer = true) {
  if (action === "status") {
    const st = hooksStatus(share.path);
    kv("hooks", st.events.length ? st.events.join(", ") + (st.complete ? "" : yellow("  (outdated \u2014 cs hooks install)")) : dim("not installed"));
    kv("timer", st.timerActive ? green("active") : dim("not active"));
    kv("last sync", st.lastSync ?? dim("never"));
    return 0;
  }
  const remove2 = action === "remove";
  installHooks(share, remove2) ? ok(`${remove2 ? "removed" : "installed"} Claude Code hooks in claude/settings.base.json (run cs apply)`) : skip(`hooks already ${remove2 ? "absent" : "present"}`);
  if (timer) ok(await installTimer(remove2));
  return 0;
}
var STOP, START, entries, HOOK_EVENTS, ours;
var init_hooks = __esm({
  "src/hooks.ts"() {
    "use strict";
    init_proc();
    init_paths();
    init_platform();
    init_share();
    init_jsonmerge();
    init_sharesync();
    init_ui();
    STOP = "command -v cs >/dev/null 2>&1 && cs share-sync --push-only --quiet --debounce 120 || true";
    START = "command -v cs >/dev/null 2>&1 && { cs share-sync --pull-only --quiet --timeout 5; cs note --print 2>/dev/null; } || true";
    entries = () => ({
      Stop: [{ hooks: [{ type: "command", command: STOP, async: true, timeout: 120 }] }],
      SessionStart: [{ matcher: "startup", hooks: [{ type: "command", command: START, timeout: 15 }] }]
    });
    HOOK_EVENTS = Object.keys(entries());
    ours = (e) => (e.hooks ?? []).some((h2) => /\bcs (share-sync|sync|handoff|note)\b/.test(String(h2.command ?? "")));
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
  fakeDir: () => fakeDir,
  getToken: () => getToken,
  listTokens: () => listTokens,
  ownerType: () => ownerType,
  repoExists: () => repoExists,
  repoUrl: () => repoUrl,
  rmToken: () => rmToken,
  setToken: () => setToken,
  tokenFile: () => tokenFile,
  whoami: () => whoami
});
import { chmodSync as chmodSync2, existsSync as existsSync12, mkdirSync as mkdirSync12, readdirSync as readdirSync5, readFileSync as readFileSync15, unlinkSync as unlinkSync5, writeFileSync as writeFileSync11 } from "node:fs";
import { join as join16 } from "node:path";
function getToken(owner2) {
  const env2 = process.env[`CS_GITHUB_TOKEN_${owner2.toUpperCase().replace(/-/g, "_")}`];
  if (env2) return env2.trim();
  const f = tokenFile(owner2);
  return existsSync12(f) ? readFileSync15(f, "utf8").trim() || void 0 : void 0;
}
async function setToken(owner2, token2) {
  token2 ||= await password2(`GitHub fine-grained token for '${owner2}' (Administration r/w on all repos)`);
  if (!token2) throw new Error("cs: empty token");
  const f = tokenFile(owner2);
  mkdirSync12(join16(csConfigDir(), "tokens"), { recursive: true, mode: 448 });
  writeFileSync11(f, token2 + "\n");
  chmodSync2(f, 384);
  return f;
}
function rmToken(owner2) {
  const f = tokenFile(owner2);
  if (existsSync12(f)) unlinkSync5(f);
}
function listTokens() {
  const d = join16(csConfigDir(), "tokens");
  return existsSync12(d) ? readdirSync5(d).sort() : [];
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
  if (fakeDir()) return "fake";
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
  if (fakeDir()) {
    const d = repoUrl(o, n3);
    if (existsSync12(d)) return false;
    mkdirSync12(d, { recursive: true });
    const { exec: exec4 } = await Promise.resolve().then(() => (init_proc(), proc_exports));
    await exec4("git", ["init", "-q", "--bare", d]);
    return true;
  }
  if (await repoExists(o, n3, t2)) return false;
  await createRepo(o, n3, t2, priv, description);
  return true;
}
var GitHubError, fakeDir, repoUrl, tokenFile, whoami, ownerType;
var init_github = __esm({
  "src/github.ts"() {
    "use strict";
    init_paths();
    init_ui();
    GitHubError = class extends Error {
    };
    fakeDir = () => process.env.CS_FAKE_GITHUB;
    repoUrl = (owner2, name2) => fakeDir() ? join16(fakeDir(), owner2, `${name2}.git`) : `git@github.com:${owner2}/${name2}.git`;
    tokenFile = (owner2) => join16(csConfigDir(), "tokens", owner2.toLowerCase());
    whoami = async (t2) => (await api("GET", "/user", t2)).login;
    ownerType = async (o, t2) => (await api("GET", `/users/${o}`, t2)).type;
  }
});

// src/projects.ts
var projects_exports = {};
__export(projects_exports, {
  add: () => add,
  chooseIdentity: () => chooseIdentity,
  clone: () => clone,
  create: () => create,
  ensureRemote: () => ensureRemote,
  fixRemote: () => fixRemote,
  newProjectOptions: () => newProjectOptions,
  rewriteIdentityFlags: () => rewriteIdentityFlags
});
import { existsSync as existsSync13, mkdirSync as mkdirSync13, writeFileSync as writeFileSync12 } from "node:fs";
import { basename as basename4, dirname as dirname5, join as join17, relative as relative6, resolve as resolve5 } from "node:path";
import { spawnSync as spawnSync4 } from "node:child_process";
function ensureIdentity(root, ident2, hasRemote) {
  const email2 = configGet(root, "user.email");
  if (email2 === ident2.email) return;
  if (hasRemote) warn(`git identity resolved to '${email2 || "UNSET"}' (expected ${ident2.email}); setting it per-repo. Run cs apply to fix globally.`);
  else info(`git identity set per-repo (${ident2.email})`);
  git(["config", "user.name", ident2.name], root);
  git(["config", "user.email", ident2.email], root);
  git(["config", "core.sshCommand", `ssh -i ${contract(expand(keyPath(ident2)))} -o IdentitiesOnly=yes`], root);
}
async function ensureRemote(root, name2, ident2, branch, o = {}) {
  mkdirSync13(root, { recursive: true });
  if (!isRepo(root)) {
    git(["init", "-q", "-b", branch], root);
    step(`git init -b ${branch}`);
  }
  branch = currentBranch(root) || branch;
  let url = remoteUrl(root);
  if (!url) {
    if (!ident2.owner) {
      fail(`identity '${ident2.id}' has no owner in projects.toml \u2014 cannot create a repo for ${name2}`);
      return void 0;
    }
    url = repoUrl(ident2.owner, name2);
    try {
      const token2 = await ensureToken(ident2.owner);
      const created = await spin(`creating ${ident2.owner}/${name2} on GitHub\u2026`, () => ensureRepo(ident2.owner, name2, token2, o.priv !== false, o.description ?? ""));
      created ? step(`github: created ${ident2.owner}/${name2}  ${dim(o.priv !== false ? "private" : "public")}`) : skip(`github: ${ident2.owner}/${name2} already exists`);
    } catch (e) {
      fail(e.message);
      if (String(e.message).includes(" 403")) info("fine-grained token needs: Repository access = All repositories, Administration = Read and write (edit the token on GitHub)");
      return void 0;
    }
    git(["remote", "add", "origin", url], root);
    step(`remote origin  ${dim(url)}`);
  }
  ensureIdentity(root, ident2, true);
  if (!out(["rev-parse", "--verify", "-q", "HEAD"], root)) {
    if (!existsSync13(join17(root, "README.md"))) writeFileSync12(join17(root, "README.md"), `# ${name2}

${o.description ?? ""}`.trimEnd() + "\n");
    if (!existsSync13(join17(root, ".gitignore"))) writeFileSync12(join17(root, ".gitignore"), ".DS_Store\n*:Zone.Identifier\n.env\n.env.*\n!.env.example\n");
    git(["add", "-A"], root);
    commit(root, "init", ident2.name, ident2.email);
    step(`first commit on ${branch}  ${dim(`${ident2.name} <${ident2.email}>`)}`);
  }
  if (!aheadBehind(root)) {
    const r2 = await spin(`pushing ${branch}\u2026`, () => gitA(["push", "-q", "-u", "origin", branch], root, { check: false, timeout: 60 }));
    if (r2.code !== 0) {
      fail(r2.err.split("\n").pop() ?? "push failed");
      return void 0;
    }
    step(`pushed ${branch}  ${dim(url)}`);
  }
  return url.includes("github") ? canonicalGithub(url) : url;
}
async function chooseIdentity(man, flag, forWhat) {
  const ids = Object.values(man.identities);
  if (!ids.length) throw new Error("cs: no identities yet \u2014 cs identity add <id> --owner <owner> --name .. --email ..");
  if (flag) {
    const i2 = man.identities[flag] ?? ids.find((x) => x.owner.toLowerCase() === flag.toLowerCase());
    if (!i2) throw new Error(`cs: unknown identity '${flag}'`);
    return i2;
  }
  if (ids.length === 1) return ids[0];
  if (!canAsk()) throw new Error(`cs: which identity for ${forWhat}? pass --identity <id> (one of ${ids.map((i2) => i2.id).join(", ")})`);
  const id = await select2(`Which identity (GitHub owner) should ${forWhat} live under?`, ids.map((i2) => ({ value: i2.id, label: i2.id, hint: `github.com/${i2.owner} \xB7 ${i2.name} <${i2.email}>` })));
  return man.identities[id];
}
async function add(share, path, o) {
  const ws = workspace2(share);
  const man = share.manifest;
  let target = resolve5(path ?? process.cwd());
  const top = toplevel(target);
  if (top) {
    target = top;
    if (basename4(top) === "repo" && dirname5(top) !== ws && sniff(dirname5(top)).layout === "worktrees") target = dirname5(top);
  }
  const rel = relative6(ws, target);
  if (!rel || rel.startsWith("..") || rel.includes("/")) throw new Error(`cs: project must be a direct child of the workspace ${contract(ws)} (got ${target})`);
  const name2 = o.name ?? rel;
  const { root: checkout, layout } = sniff(target);
  if (man.projects[name2]) throw new Error(`cs: project '${name2}' is already registered (edit projects.toml to change it)`);
  let url = remoteUrl(checkout);
  let ident2;
  if (!url) {
    ident2 = await chooseIdentity(man, o.identity, name2);
    const made = await ensureRemote(checkout, name2, ident2, currentBranch(checkout) || man.defaultBranch, { priv: o.priv, description: o.description });
    if (!made) throw new Error(`cs: ${name2} still has no remote`);
    url = made;
  } else {
    if (url.includes("github")) url = canonicalGithub(url);
    ident2 = o.identity ? man.identities[o.identity] : identityForUrl(man, url);
    if (!ident2) throw new Error(`cs: no identity matches ${url}; pass --identity or add url_globs in projects.toml`);
  }
  const p = { name: name2, path: rel !== name2 ? rel : void 0, url, identity: ident2.id, profiles: o.profiles.length ? o.profiles : ["all"], machines: [], branch: currentBranch(checkout), layout, description: o.description, handoff: {} };
  const errs = validate({ ...man, projects: { [name2]: p } });
  if (errs.length) throw new Error("cs: " + errs.join("; "));
  addProject(share, p);
  ok(`registered ${name2}  ${dim(`${url} \xB7 profiles ${p.profiles.join(",")}`)}`);
  if (!o.noCommit) commit2(share, `projects: add ${name2}`, ["projects.toml"]);
  if (selected(p, share.machine)) place(share, p);
  return p;
}
async function fixRemote(share, p, identityFlag) {
  const man = share.manifest;
  const root = checkoutRoot(p, workspace2(share));
  const ident2 = p.identity && man.identities[p.identity] ? man.identities[p.identity] : await chooseIdentity(man, identityFlag, p.name);
  const url = await ensureRemote(root, p.name, ident2, currentBranch(root) || p.branch || man.defaultBranch);
  if (!url) return false;
  updateProject(share, { ...p, url, identity: ident2.id, branch: currentBranch(root) || p.branch });
  commit2(share, `projects: ${p.name} remote`, ["projects.toml"]);
  ok(`${p.name}: remote recorded  ${dim(url)}`);
  return true;
}
async function clone(share, names, dryRun = false) {
  const ws = workspace2(share);
  const man = share.manifest;
  let rc = 0;
  const cloned = [];
  for (const p of selectedProjects2(share)) {
    if (names.length && !names.includes(p.name)) continue;
    const c2 = locate(p, ws);
    const root = c2.root, cont = container(p, ws);
    if (present(c2)) {
      if (p.url && canonicalGithub(remoteUrl(root)) !== canonicalGithub(p.url)) {
        fail(`${p.name}: exists with a different remote (${remoteUrl(root)}); not touching it`);
        rc = 1;
      }
      continue;
    }
    if (c2.why !== "missing") continue;
    if (!p.url) {
      warn(`${p.name}: no remote recorded \u2014 cannot clone it here (on the machine that has it: cs doctor --fix)`);
      rc = 1;
      continue;
    }
    if (dryRun) {
      step(`${p.name}: would clone ${p.url} \u2192 ${contract(root)}`);
      continue;
    }
    mkdirSync13(cont, { recursive: true });
    let r2 = await spin(`cloning ${p.name}\u2026`, () => gitA(["clone", "-q", ...p.branch ? ["-b", p.branch] : [], p.url, root], void 0, { check: false }));
    let note3 = "";
    if (r2.code !== 0 && p.branch && /Remote branch .* not found/.test(r2.err)) {
      r2 = await spin(`cloning ${p.name} (default branch)\u2026`, () => gitA(["clone", "-q", p.url, root], void 0, { check: false }));
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
    if (p.postClone) spawnSync4("bash", ["-lc", p.postClone], { cwd: cont, stdio: "inherit" });
    cloned.push(p);
  }
  if (cloned.length) {
    for (const p of cloned) place(share, p);
    step(`project state placed into ${cloned.length} project(s)`);
  }
  return rc;
}
function rewriteIdentityFlags(argv, man) {
  return argv.flatMap((a2) => {
    if (!a2.startsWith("--") || a2.includes("=")) return [a2];
    const hit = identityByFlag(man, a2.slice(2));
    return hit ? ["--identity", hit.id] : [a2];
  });
}
function newProjectOptions(share, o) {
  const man = share.manifest, m = share.machine;
  if (!o.identity) throw new Error(`cs: which identity? use one of ${Object.keys(man.identities).map((i2) => "--" + i2).join(", ")} (or --identity <id>)`);
  const ident2 = man.identities[o.identity] ?? identityByFlag(man, o.identity);
  if (!ident2) throw new Error(`cs: unknown identity '${o.identity}'`);
  const profiles = o.profiles.length ? o.profiles : m.profiles.includes(ident2.id) ? [ident2.id] : [...m.profiles];
  return { ident: ident2, profiles };
}
async function create(share, name2, ident2, o) {
  const man = share.manifest;
  if (!NAME_RE.test(name2)) throw new Error(`cs: '${name2}' is not a valid project name`);
  if (man.projects[name2]) throw new Error(`cs: project '${name2}' is already registered`);
  const ws = workspace2(share), root = join17(ws, name2), branch = man.defaultBranch;
  intro2(`new project ${bold(name2)}`);
  kv("identity", `${ident2.id}  ${dim(`${ident2.name} <${ident2.email}>`)}`);
  kv("path", contract(root));
  kv("remote", repoUrl(ident2.owner, name2));
  kv("branch", branch);
  kv("profiles", o.profiles.join(", "));
  const url = await ensureRemote(root, name2, ident2, branch, { priv: o.priv, description: o.description });
  if (!url) return 1;
  const p = { name: name2, url, identity: ident2.id, profiles: o.profiles, machines: [], branch: currentBranch(root) || branch, layout: "plain", description: o.description, handoff: {} };
  addProject(share, p);
  commit2(share, `projects: add ${name2}`, ["projects.toml"]);
  step(`registered in projects.toml  ${dim(`profiles ${o.profiles.join(",")}`)}`);
  if (selected(p, share.machine)) place(share, p);
  step("project state placed (memory \u2192 share)");
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
    init_share();
    init_projectstate();
    init_checkout();
    init_ui();
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
import { chmodSync as chmodSync3, copyFileSync as copyFileSync4, existsSync as existsSync14, mkdirSync as mkdirSync14, readdirSync as readdirSync6, readFileSync as readFileSync16, rmSync as rmSync6, writeFileSync as writeFileSync13 } from "node:fs";
import { dirname as dirname6, join as join18, relative as relative7 } from "node:path";
import { spawnSync as spawnSync5 } from "node:child_process";
function sops(args, repo, input, check = true) {
  const p = spawnSync5(exe("sops"), args, { cwd: repo, env: env(), encoding: "utf8", input, stdio: ["pipe", "pipe", "pipe"] });
  if (check && p.status !== 0) throw new Error(`cs: sops ${args.join(" ")} failed: ${(p.stderr ?? "").trim()}`);
  return p;
}
async function sopsA(args, repo) {
  const { exec: exec4 } = await Promise.resolve().then(() => (init_proc(), proc_exports));
  const p = await exec4(exe("sops"), args, { cwd: repo, env: env() });
  if (p.code !== 0) throw new Error(`cs: sops ${args.join(" ")} failed: ${p.err}`);
  return p;
}
function publicKey() {
  if (!existsSync14(keyFile())) return "";
  const line = readFileSync16(keyFile(), "utf8").split("\n").find((l2) => l2.startsWith("# public key:"));
  if (line) return line.split(":")[1].trim();
  return (spawnSync5(exe("age-keygen"), ["-y", keyFile()], { encoding: "utf8" }).stdout ?? "").trim();
}
function keygen() {
  mkdirSync14(dirname6(keyFile()), { recursive: true, mode: 448 });
  const p = spawnSync5(exe("age-keygen"), ["-o", keyFile()], { encoding: "utf8" });
  if (p.status !== 0) throw new Error(`cs: age-keygen failed: ${p.stderr}`);
  chmodSync3(keyFile(), 384);
}
function recipients(repo) {
  const f = join18(repo, ".sops.yaml");
  if (!existsSync14(f)) return [];
  const t2 = readFileSync16(f, "utf8");
  const m = t2.match(/age:\s*>-?\s*\n((?:\s+.+\n?)+)/);
  if (m) return m[1].replace(/\n/g, " ").split(",").map((x) => x.trim()).filter(Boolean);
  const m2 = t2.match(/age:\s*(\S.*)/);
  return m2 ? m2[1].split(",").map((x) => x.trim()).filter(Boolean) : [];
}
function writeRecipients(repo, recs) {
  writeFileSync13(join18(repo, ".sops.yaml"), `# sops recipients \u2014 managed by cs secrets init / cs trust / cs untrust
creation_rules:
  - path_regex: ${RULE}
    age: >-
` + recs.map((r2) => `      ${r2}`).join(",\n") + "\n");
}
function envFiles(repo) {
  const out2 = [];
  const rec = (d) => {
    if (!existsSync14(d)) return;
    for (const e of readdirSync6(d, { withFileTypes: true })) {
      const f = join18(d, e.name);
      e.isDirectory() ? rec(f) : f.endsWith(".env") && out2.push(f);
    }
  };
  rec(join18(repo, "secrets"));
  return out2.sort();
}
async function updatekeys(repo) {
  const { exec: exec4 } = await Promise.resolve().then(() => (init_proc(), proc_exports));
  let n3 = 0;
  for (const f of envFiles(repo)) if (isEncrypted(f)) {
    const p = await exec4(exe("sops"), ["updatekeys", "-y", relative7(repo, f)], { cwd: repo, env: env() });
    if (p.code !== 0) throw new Error(`cs: sops updatekeys failed: ${p.err}`);
    n3++;
  }
  return n3;
}
var RULE, keyFile, env, exe, machinePubFile, isEncrypted, SopsBackend;
var init_sops = __esm({
  "src/secrets/sops.ts"() {
    "use strict";
    init_paths();
    init_deps();
    init_share();
    init_secrets();
    init_ui();
    RULE = "^secrets/.*\\.env$";
    keyFile = () => process.env.SOPS_AGE_KEY_FILE || join18(home(), ".config", "sops", "age", "keys.txt");
    env = () => {
      const e = { ...process.env, SOPS_AGE_KEY_FILE: keyFile() };
      delete e.SOPS_AGE_RECIPIENTS;
      return e;
    };
    exe = (n3) => which(n3) || join18(home(), ".local", "bin", n3);
    machinePubFile = (repo, machine) => join18(repo, "machines", machine, "age.pub");
    isEncrypted = (f) => {
      try {
        return readFileSync16(f, "utf8").includes("sops_version=");
      } catch {
        return false;
      }
    };
    SopsBackend = {
      name: "sops",
      async init(share) {
        const repo = share.path, m = share.machine;
        if (existsSync14(keyFile())) skip(`age key present at ${contract(keyFile())}`);
        else {
          keygen();
          ok(`generated age key ${contract(keyFile())} (0600, never synced)`);
        }
        const pub = publicKey();
        const pf = machinePubFile(repo, m.name);
        if (!existsSync14(pf) || readFileSync16(pf, "utf8").trim() !== pub) {
          mkdirSync14(dirname6(pf), { recursive: true });
          writeFileSync13(pf, pub + "\n");
          commit2(share, `machines: ${m.name} age.pub`, [pf]);
          ok(`published ${contract(pf)}`);
        }
        const recs = recipients(repo);
        if (!recs.length) {
          writeRecipients(repo, [pub]);
          commit2(share, "secrets: first recipient", [".sops.yaml"]);
          ok("this is the first machine: registered as the only recipient");
          const hook = join18(repo, ".git", "hooks", "pre-commit"), src = join18(toolRoot(), "hooks", "pre-commit-secrets-guard.sh");
          if (existsSync14(src) && !existsSync14(hook)) {
            copyFileSync4(src, hook);
            chmodSync3(hook, 493);
            ok("installed pre-commit plaintext guard in the share");
          }
        } else if (recs.includes(pub)) ok("this machine can decrypt secrets");
        else step("this machine is not a recipient yet");
        mkdirSync14(join18(repo, "secrets", "projects"), { recursive: true });
      },
      ready: (repo) => existsSync14(keyFile()) && recipients(repo).includes(publicKey()),
      loadEnv(repo, name2) {
        const f = envFile(repo, name2);
        if (!existsSync14(f)) return {};
        return parseDotenv(sops(["-d", "--input-type", "dotenv", "--output-type", "dotenv", relative7(repo, f)], repo).stdout);
      },
      writeEnv(repo, name2, values) {
        const f = envFile(repo, name2);
        mkdirSync14(dirname6(f), { recursive: true });
        const rel = relative7(repo, f);
        const tmp = join18(dirname6(f), `.${name2.replace(/\//g, "_")}.plain.${process.pid}.env`);
        writeFileSync13(tmp, dumpDotenv(values), { mode: 384 });
        try {
          const p = sops(["-e", "--input-type", "dotenv", "--output-type", "dotenv", "--filename-override", rel, relative7(repo, tmp)], repo);
          writeFileSync13(f, p.stdout);
        } finally {
          rmSync6(tmp, { force: true });
        }
        return f;
      },
      async loadEnvA(repo, name2) {
        const f = envFile(repo, name2);
        if (!existsSync14(f)) return {};
        return parseDotenv((await sopsA(["-d", "--input-type", "dotenv", "--output-type", "dotenv", relative7(repo, f)], repo)).out);
      },
      async writeEnvA(repo, name2, values) {
        const f = envFile(repo, name2);
        mkdirSync14(dirname6(f), { recursive: true });
        const rel = relative7(repo, f);
        const tmp = join18(dirname6(f), `.${name2.replace(/\//g, "_")}.plain.${process.pid}.env`);
        writeFileSync13(tmp, dumpDotenv(values), { mode: 384 });
        try {
          const p = await sopsA(["-e", "--input-type", "dotenv", "--output-type", "dotenv", "--filename-override", rel, relative7(repo, tmp)], repo);
          writeFileSync13(f, p.out);
        } finally {
          rmSync6(tmp, { force: true });
        }
        return f;
      },
      edit(repo, name2) {
        const f = envFile(repo, name2);
        if (!existsSync14(f)) this.writeEnv(repo, name2, { EXAMPLE_KEY: "value" });
        spawnSync5(exe("sops"), ["--input-type", "dotenv", "--output-type", "dotenv", relative7(repo, f)], { cwd: repo, env: env(), stdio: "inherit" });
      },
      status(share) {
        const repo = share.path, m = share.machine;
        const pub = publicKey(), recs = recipients(repo);
        kv("age key", contract(keyFile()) + (existsSync14(keyFile()) ? "" : red("  missing")));
        kv("recipient", pub && recs.includes(pub) ? green("yes") : red("no \u2014 cs trust " + m.name));
        const names = {};
        const md = join18(repo, "machines");
        if (existsSync14(md)) for (const d of readdirSync6(md)) {
          const pf = join18(md, d, "age.pub");
          if (existsSync14(pf)) names[readFileSync16(pf, "utf8").trim()] = d;
        }
        kv("recipients", recs.map((r2) => names[r2] ?? r2.slice(0, 14) + "\u2026").join(", ") || "-");
        kv("files", envFiles(repo).map((f) => relative7(repo, f)).join(", ") || "-");
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
      loadEnvA: async () => ({}),
      writeEnvA: no,
      edit: no,
      status: () => info("backend none")
    };
  }
});

// src/secrets/index.ts
import { join as join19 } from "node:path";
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
    envFile = (repo, name2) => name2 === "global" ? join19(repo, "secrets", "global.env") : join19(repo, "secrets", "projects", `${name2}.env`);
    dumpDotenv = (v) => Object.entries(v).map(([k, val]) => `${k}=${/[ #"'\\$`]/.test(val) || val === "" ? JSON.stringify(val) : val}`).join("\n") + (Object.keys(v).length ? "\n" : "");
  }
});

// src/envfiles.ts
import { chmodSync as chmodSync4, existsSync as existsSync15, mkdirSync as mkdirSync15, readdirSync as readdirSync7, readFileSync as readFileSync17, rmSync as rmSync7, statSync as statSync8, writeFileSync as writeFileSync14 } from "node:fs";
import { dirname as dirname7, join as join20 } from "node:path";
function storedFiles(repo, project, others) {
  const d = join20(repo, "secrets", "projects");
  if (!existsSync15(d)) return [];
  return readdirSync7(d).filter((n3) => n3.endsWith(".env")).map((n3) => n3.slice(0, -4)).filter((e) => !others.has(e) || e === project).map((e) => fileOf(project, e)).filter((f) => !!f);
}
async function observeEnv(share, b, p, root, others) {
  const repo = share.path;
  const extraLocal = p.env && p.env.local || [];
  const here = existsSync15(root) ? readdirSync7(root).filter(isEnvName) : [];
  const files = [.../* @__PURE__ */ new Set([...here, ...storedFiles(repo, p.name, others)])].sort();
  const out2 = [];
  const example = readValues(join20(root, ".env.example"));
  for (const file of files) {
    const tracked = git(["ls-files", "--error-unmatch", "--", file], root, { check: false }).code === 0;
    const ignored = git(["check-ignore", "-q", "--", file], root, { check: false }).code === 0;
    const kind = classify(file, { tracked, ignored }, extraLocal);
    const name2 = storeName(p.name, file), path = join20(root, file), sf = envFile(repo, name2);
    const st = { project: p.name, file, kind, name: name2, path, localText: "", merge: { result: {}, toLocal: [], toStore: [], conflicts: [] } };
    if (kind !== "values" && kind !== "local") {
      out2.push(st);
      continue;
    }
    if (kind === "local") st.example = example;
    if (existsSync15(path)) {
      st.localText = readFileSync17(path, "utf8");
      st.local = parseDotenv(st.localText);
      st.localWhen = mtime(path);
    }
    if (existsSync15(sf)) {
      st.stored = await b.loadEnvA(repo, name2);
      const s = stampOf(share, sf);
      st.storedWhen = s.when;
      st.storedFrom = s.from;
    }
    if (st.local && st.stored) st.base = readValues(snapshotFile(p.name, file));
    st.merge = mergeOf(st);
    out2.push(st);
  }
  return out2;
}
function writeSnapshot(st, values) {
  const f = snapshotFile(st.project, st.file);
  if (st.kind === "local") values = blank(values);
  if (!Object.keys(values).length) {
    rmSync7(f, { force: true });
    return;
  }
  mkdirSync15(dirname7(f), { recursive: true, mode: 448 });
  writeFileSync14(f, dumpDotenv(values), { mode: 384 });
}
async function applyEnv(share, b, st, decide3 = {}) {
  const repo = share.path;
  const m = mergeOf(st, decide3);
  if (m.conflicts.length) throw new Error(`cs: ${st.project} ${st.file}: undecided keys ${m.conflicts.map((c2) => c2.key).join(", ")}`);
  const empty = !Object.keys(m.result).length;
  if (m.toStore.length) {
    if (empty) rmSync7(envFile(repo, st.name), { force: true });
    else await b.writeEnvA(repo, st.name, st.kind === "local" ? blank(m.result) : m.result);
  }
  if (m.toLocal.length) {
    if (st.local) {
      const prev = snapshotFile(st.project, st.file) + ".prev";
      mkdirSync15(dirname7(prev), { recursive: true, mode: 448 });
      writeFileSync14(prev, st.localText, { mode: 384 });
    }
    if (empty) rmSync7(st.path, { force: true });
    else {
      const fresh = !existsSync15(st.path);
      writeFileSync14(st.path, patchDotenv(st.localText, m.result));
      if (fresh) chmodSync4(st.path, 384);
    }
  }
  writeSnapshot(st, m.result);
  return { stored: m.toStore.length, local: m.toLocal.length, toFill: "toFill" in m ? m.toFill.filter((k) => m.toLocal.includes(k)) : [] };
}
function snapshotInSync(st) {
  if (st.kind !== "values" && st.kind !== "local" || !st.local || !st.stored || st.merge.toLocal.length || st.merge.toStore.length || st.merge.conflicts.length) return;
  writeSnapshot(st, st.merge.result);
}
var mergeOf, snapshotFile, readValues, mtime, newestSide;
var init_envfiles = __esm({
  "src/envfiles.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_share();
    init_secrets();
    init_env();
    mergeOf = (st, decide3 = {}) => st.kind === "local" ? mergeKeys(st.base && Object.keys(st.base), st.local ?? {}, Object.keys(st.stored ?? {}), st.example ?? {}) : merge3(st.base, st.local ?? {}, st.stored ?? {}, decide3);
    snapshotFile = (project, file) => join20(stateDir(), "env", project, file);
    readValues = (f) => existsSync15(f) ? parseDotenv(readFileSync17(f, "utf8")) : void 0;
    mtime = (f) => new Date(statSync8(f).mtimeMs).toISOString();
    newestSide = (st) => st.storedWhen && st.localWhen && Date.parse(st.storedWhen) > Date.parse(st.localWhen) ? "stored" : "local";
  }
});

// src/gather.ts
import { readdirSync as readdirSync8 } from "node:fs";
async function gather(share, o) {
  const ws = workspace2(share);
  const m = share.machine;
  const facts = [];
  const backend = await getBackend(m);
  const canRead = backend.name !== "none" && backend.ready(share.path);
  const envSkipped = [];
  const names = new Set(Object.keys(share.manifest.projects));
  for (const p of selectedProjects2(share)) {
    const c2 = locate(p, ws);
    if (!present(c2)) continue;
    const f = { checkout: c2, waiting: [] };
    facts.push(f);
    if (p.env !== false) {
      if (canRead) {
        try {
          f.env = await observeEnv(share, backend, p, c2.root, names);
        } catch (e) {
          envSkipped.push(`${p.name}: .env files not carried \u2014 ${String(e?.message ?? e).replace(/^cs: /, "").split("\n")[0]}`);
        }
      } else if (!envSkipped.length && hasIgnoredEnv(c2.root)) envSkipped.push(backend.name === "none" ? ".env files not carried \u2014 secrets backend is 'none' (machine.toml [secrets].backend)" : `.env files not carried \u2014 this machine cannot read the secrets yet: cs secrets init here, or cs trust ${m.name} on a machine that can`);
    }
    if (!enabled(p)) continue;
    const r2 = await spin(`${p.name}: fetching\u2026`, () => fetchWaiting(c2, { timeout: o.timeout, fetch: o.fetch }));
    if (!r2.ok) {
      f.offline = true;
      continue;
    }
    f.waiting = r2.list;
  }
  return { facts, envSkipped };
}
var hasIgnoredEnv;
var init_gather = __esm({
  "src/gather.ts"() {
    "use strict";
    init_git();
    init_share();
    init_checkout();
    init_secrets();
    init_envfiles();
    init_env();
    init_ui();
    hasIgnoredEnv = (root) => {
      try {
        return readdirSync8(root).some((n3) => isEnvName(n3) && git(["check-ignore", "-q", "--", n3], root, { check: false }).code === 0);
      } catch {
        return false;
      }
    };
  }
});

// src/sync.ts
var sync_exports = {};
__export(sync_exports, {
  runSync: () => runSync
});
function report(facts) {
  for (const f of facts) {
    const name2 = f.checkout.project.name;
    for (const w of f.waiting) step(`${name2} \xB7 ${w.branch}  handoff waiting from ${w.machine} (${when(w.when)})`);
    for (const u5 of f.checkout.units) if ((u5.dirty || u5.unpushed) && !u5.skip) step(`${name2} \xB7 ${u5.branch}  ${[u5.dirty ? count(u5.dirty, "change") : "", u5.unpushed ? count(u5.unpushed, "unpushed commit") : ""].filter(Boolean).join(", ")}`);
    for (const e of f.env ?? []) if (e.kind === "values" || e.kind === "local") {
      const what = e.kind === "local" ? describeKeys({ toFill: [], ...e.merge }, e.storedFrom) : describeMerge(e.merge, e.storedFrom);
      if (what) step(`${name2} \xB7 ${e.file}  ${what}`);
    }
  }
}
async function planScreen(pl) {
  const byId = new Map(pl.actions.map((a2) => [a2.id, a2]));
  let picked = new Set(pl.actions.filter((a2) => a2.checked).map((a2) => a2.id));
  const summary2 = (ids) => pl.actions.map((a2) => (ids.has(a2.id) ? green("\u2713 ") : dim("\u25CB ")) + `${a2.kind.padEnd(5)} ${a2.label}  ${dim(a2.hint)}`);
  if (!canAsk()) {
    note2(summary2(picked), `${picked.size} of ${pl.actions.length} actions (defaults \u2014 no terminal to ask)`);
    return pl.actions.filter((a2) => picked.has(a2.id));
  }
  const groups = {};
  for (const a2 of pl.actions) (groups[GROUP[a2.kind]] ??= []).push({ value: a2.id, label: a2.label, hint: a2.hint });
  for (; ; ) {
    picked = new Set((await groupMultiselect2("What should cs sync do?", groups, [...picked])).filter((v) => byId.has(v)));
    note2(summary2(picked), `${picked.size} of ${pl.actions.length} actions`);
    if (await proceed("proceed?", "Yes, continue", "Change selection")) break;
  }
  return pl.actions.filter((a2) => picked.has(a2.id));
}
async function syncShare(share, title, done, copyBack, opts) {
  const once = (t2, extra) => group(t2, async () => {
    copyBack();
    const r3 = await shareGitSync(share, "share", { ...opts, ...extra, ask: canAsk() });
    if (r3.offline) step("offline \u2014 local changes wait for the next sync");
    return r3;
  }, { done });
  let r2 = await once(title, {});
  const answers = {};
  while (r2.conflicts?.length) {
    for (const c2 of r2.conflicts) answers[c2.file] = await select2(
      `${c2.file} changed on both machines \u2014 keep which version?`,
      [{ value: "ours", label: "this machine's version", hint: describe2(c2.ours) }, { value: "theirs", label: "the other machine's version", hint: describe2(c2.theirs) }],
      newest(c2)
    );
    r2 = await once("share settled", { resolve: answers });
  }
  return r2;
}
async function askQuestions(qs) {
  const out2 = [];
  for (const q of qs) {
    if (!canAsk()) {
      warn(`${q.why}
${cyan("\u2192 ")}kept local, the handoff stays waiting \u2014 run cs sync in a terminal to choose`);
      out2.push({ q, answer: "keep" });
      continue;
    }
    const options = [
      { value: "keep", label: "keep mine, leave the handoff waiting", hint: "nothing moves; asked again next sync" },
      { value: "apply", label: `apply the handoff from ${q.handoff.machine}`, hint: "my changes here go to a backup ref" },
      ...q.sameBranch ? [{ value: "send", label: "send mine over it", hint: "the waiting handoff goes to a backup ref, then my changes replace it" }] : []
    ];
    const answer = await select2(`${q.why} \u2014 what now?`, options, "keep");
    if (answer === "keep") skip(`${q.checkout.project.name} \xB7 ${q.handoff.branch}: kept local \u2014 the handoff from ${q.handoff.machine} stays waiting`);
    out2.push({ q, answer });
  }
  return out2;
}
async function askEnvKeys(qs) {
  const out2 = /* @__PURE__ */ new Map();
  for (const q of qs) {
    const st = q.env;
    const c2 = st.merge.conflicts.find((x) => x.key === q.key);
    if (!c2) continue;
    const other = st.storedFrom ? `${st.storedFrom}'s value` : "the share's value";
    const newest2 = newestSide(st);
    let side;
    if (!canAsk()) {
      side = newest2;
      warn(`${q.why}
${cyan("\u2192 ")}newest kept: ${side === "local" ? "this machine's value" : other} \u2014 run cs sync in a terminal to choose`);
    } else side = await select2(`${q.why} \u2014 keep which value?`, [
      { value: "local", label: "this machine's value", hint: `${mask(c2.local)}${st.localWhen ? `, changed ${when(st.localWhen)}` : ""}` },
      { value: "stored", label: other, hint: `${mask(c2.stored)}${st.storedWhen ? `, stored ${when(st.storedWhen)}` : ""}` }
    ], newest2);
    step(`${st.project} \xB7 ${st.file}: ${q.key} \u2014 ${side === "local" ? "this machine's value kept" : `${other} taken`}`);
    if (!out2.has(st)) out2.set(st, {});
    out2.get(st)[q.key] = side;
  }
  return out2;
}
async function runSync(share, o = {}) {
  const repo = share.path, m = share.machine;
  const release = acquire();
  if (!release) throw new Error("cs: another cs sync is running here (or the hooks' share sync, a few seconds) \u2014 wait for it to finish");
  process.on("exit", release);
  const timeout = o.timeout ?? 20;
  let rc = 0;
  const copyBack = () => {
    placeAll(share);
  };
  const first = await syncShare(share, "share synced", "already in sync", copyBack, { timeout });
  if (!first.ok) rc = 2;
  const man = reload(share).manifest;
  const ws = workspace2(share);
  await group("repaired", async () => {
    const hs = hooksStatus(repo);
    if (!hs.complete) {
      installHooks(share);
      step("Claude Code hooks re-installed");
    }
    if (!hs.timerFiles || hs.timerSupported && !hs.timerActive) step(`timer: ${await installTimer()}`);
    const changes = [];
    applySettings(share, false, changes);
    applyLinks(repo, false, changes);
    applyGit(man, false, changes);
    applyShellRc(false, changes);
    changes.push(...placeAll(share));
    for (const c2 of changes) step(c2);
  }, { done: "nothing to repair" });
  const missing = () => new Set(selectedProjects2(share).filter((p) => {
    const c2 = locate(p, ws);
    return !present(c2) && c2.why === "missing";
  }).map((p) => p.name));
  const before = missing();
  if (await group("cloned", () => clone(share, []), { done: "nothing missing" })) rc = rc || 1;
  const after = missing();
  const cloned = [...before].filter((n3) => !after.has(n3)).length;
  const { facts, envSkipped } = await group("projects checked", async () => {
    const g = await gather(share, { timeout });
    report(g.facts);
    return g;
  }, { done: "all clean, nothing waiting" });
  const pl = plan(facts, m.name);
  for (const s of pl.skipped) skip(s);
  for (const s of envSkipped) skip(s);
  let chosen = [];
  const unreachable = facts.filter((f) => f.offline).length;
  if (pl.actions.length) chosen = await planScreen(pl);
  else if (!pl.questions.length) info(dim(unreachable ? `nothing moved \u2014 ${unreachable} remote(s) unreachable` : "nothing to move \u2014 no handoffs waiting, nothing stale here"));
  const answered = await askQuestions(pl.questions.filter((q) => q.kind === "dirty-vs-waiting"));
  const kept = answered.filter((a2) => a2.answer === "keep").length;
  const envRows = chosen.filter((a2) => a2.kind === "env");
  const decided = await askEnvKeys(pl.questions.filter((q) => q.kind === "env-key" && envRows.some((a2) => a2.env === q.env)));
  const notes = [];
  let applied = 0, sent = 0;
  const sends = chosen.filter((a2) => a2.kind === "send"), applies = chosen.filter((a2) => a2.kind === "apply");
  const over = answered.filter((a2) => a2.answer === "send").map((a2) => a2.q), replace = answered.filter((a2) => a2.answer === "apply").map((a2) => a2.q);
  if (sends.length || over.length) await group("handoffs sent", async () => {
    for (const a2 of sends) if ((await send(a2.checkout, a2.unit, m, { note: o.note })).ok) sent++;
    for (const q of over) if ((await send(q.checkout, q.unit, m, { note: o.note, over: q.handoff })).ok) sent++;
  });
  if (applies.length || replace.length) await group("handoffs applied", async () => {
    const one = async (a2, replace2) => {
      const r2 = await apply(a2.checkout, a2.handoff, m, { replace: replace2 });
      if (!r2.ok) return;
      applied++;
      place(share, a2.checkout.project);
      if (r2.note) notes.push([`${a2.checkout.project.name} \u2014 note from ${a2.handoff.machine}`, ...r2.note.trim().split("\n")]);
    };
    for (const a2 of applies) await one(a2, false);
    for (const q of replace) await one(q, true);
  });
  for (const [title, ...lines] of notes) note2(lines, title);
  let pushed = 0;
  const pushes = chosen.filter((a2) => a2.kind === "push");
  if (pushes.length) await group("branches pushed", async () => {
    for (const a2 of pushes) if ((await push(a2.checkout, a2.unit)).ok) pushed++;
  });
  let envDone = 0;
  const states = facts.flatMap((f) => f.env ?? []);
  const keysOnly = states.filter((st) => st.kind === "local" && (st.merge.toLocal.length || st.merge.toStore.length));
  if (envRows.length || keysOnly.length) await group(".env files", async () => {
    const b = await getBackend(m);
    const one = async (label, st, decide3) => {
      try {
        const r2 = await applyEnv(share, b, st, decide3);
        envDone++;
        step(`${label}: ${[r2.stored ? `${count(r2.stored, "key")} stored` : "", r2.local ? `${count(r2.local, "key")} taken${st.storedFrom ? ` from ${st.storedFrom}` : ""}` : ""].filter(Boolean).join(", ")}${r2.toFill.length ? yellow(` \u2014 to fill in: ${r2.toFill.join(", ")}`) : ""}`);
      } catch (e) {
        fail(`${label}: ${String(e?.message ?? e).replace(/^cs: /, "")}`);
      }
    };
    for (const a2 of envRows) await one(a2.label, a2.env, decided.get(a2.env) ?? {});
    for (const st of keysOnly) await one(`${st.project} \xB7 ${st.file}`, st, {});
  });
  for (const st of states) snapshotInSync(st);
  const failed = chosen.length + over.length + replace.length + keysOnly.length - sent - applied - pushed - envDone;
  if (failed) rc = rc || 1;
  const last = await syncShare(share, "share pushed", first.offline ? "committed locally \u2014 offline, pushed by the next sync" : "already in sync", copyBack, { timeout, commitOnly: first.offline });
  if (!last.ok) rc = 2;
  const bits = [applied ? `${applied} handoff(s) applied` : "", sent ? `${sent} handoff(s) sent` : "", pushed ? `${pushed} branch(es) pushed` : "", envDone ? `${envDone} .env file(s) merged` : "", cloned ? `${cloned} project(s) cloned` : "", kept ? yellow(`${kept} handoff(s) left waiting \u2014 see above`) : ""].filter(Boolean);
  const summary2 = rc === 2 ? red("share not synced \u2014 see above") : failed ? red(`${failed} action(s) failed \u2014 see above`) : bits.length ? bits.join(" \xB7 ") : dim(first.offline || last.offline ? "offline \u2014 local parts done, nothing moved" : "nothing to move");
  return { rc, summary: summary2 };
}
var GROUP, mask;
var init_sync = __esm({
  "src/sync.ts"() {
    "use strict";
    init_lock();
    init_share();
    init_apply();
    init_projectstate();
    init_hooks();
    init_sharesync();
    init_projects();
    init_checkout();
    init_gather();
    init_secrets();
    init_envfiles();
    init_env();
    init_plan();
    init_ui();
    GROUP = { send: "handoffs to send", apply: "handoffs to apply", push: "branches to push", env: ".env files to store or update" };
    mask = (v) => v === void 0 ? "removed" : v.length > 8 ? v.slice(0, 3) + "\u2026" + v.slice(-2) : "\u2026";
  }
});

// src/sharekey.ts
var sharekey_exports = {};
__export(sharekey_exports, {
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
  setup: () => setup,
  sshCommand: () => sshCommand,
  usesKey: () => usesKey
});
import { chmodSync as chmodSync5, existsSync as existsSync16, mkdirSync as mkdirSync16, readFileSync as readFileSync18 } from "node:fs";
import { dirname as dirname8 } from "node:path";
import { spawnSync as spawnSync6 } from "node:child_process";
function ensureKey(machine = "") {
  const key = keyPath2(), pubf = key + ".pub";
  if (existsSync16(key) && existsSync16(pubf)) return { key, pub: readFileSync18(pubf, "utf8").trim(), created: false };
  mkdirSync16(dirname8(key), { recursive: true, mode: 448 });
  const p = spawnSync6("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-C", `cs:${machine || nodename()}:share-key`, "-f", key]);
  if (p.status !== 0) throw new Error("cs: ssh-keygen failed");
  chmodSync5(key, 384);
  return { key, pub: readFileSync18(pubf, "utf8").trim(), created: true };
}
function parseRepoUrl(text3) {
  const t2 = text3.trim().replace(/\/+$/, "");
  const m = t2.match(/^(?:https?:\/\/|ssh:\/\/git@|git@)?(?:www\.)?github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);
  return m ? [`git@github.com:${m[1]}/${m[2]}.git`, [m[1], m[2]]] : [t2, void 0];
}
async function isPublic(url) {
  if (!url.startsWith("https://") || process.env.CS_OFFLINE) return void 0;
  const { exec: exec4 } = await Promise.resolve().then(() => (init_proc(), proc_exports));
  const p = await exec4("git", ["ls-remote", "--exit-code", url, "HEAD"], { env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }, timeout: 30 });
  if (p.code === 0) return true;
  return /Authentication failed|could not read Username|Repository not found/.test(p.err) ? false : void 0;
}
async function canAccess(sshUrl) {
  const { exec: exec4 } = await Promise.resolve().then(() => (init_proc(), proc_exports));
  const p = await exec4("git", ["ls-remote", sshUrl, "HEAD"], { timeout: 30, env: { ...process.env, GIT_SSH_COMMAND: `ssh -i ${keyPath2()} -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=accept-new` } });
  return [p.code === 0, p.err.split("\n").pop() ?? ""];
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
  lines.push(`title  ${bold(`cs:${machine}:share-key`)}`, `key    ${bold(pub)}`, "", dim("this key only reaches the share; identities get their own keys"));
  note2(lines, "Add this machine's share key to the share");
}
async function setup(shareDir2, interactive = true) {
  const url = remoteUrl(shareDir2);
  if (!url) {
    warn("share has no remote");
    return 1;
  }
  const [sshUrl, gh] = parseRepoUrl(url);
  const { pub, created } = ensureKey();
  kv("share key", KEY() + (created ? "  (generated)" : ""));
  let [ok2] = await spin("checking access\u2026", () => canAccess(sshUrl));
  while (!ok2) {
    instructions(pub, gh, (await Promise.resolve().then(() => (init_machine(), machine_exports))).loadMachine().name);
    if (!interactive || !await proceed("added the key?")) return 1;
    [ok2] = await spin("checking access\u2026", () => canAccess(sshUrl));
  }
  if (sshUrl !== url) git(["remote", "set-url", "origin", sshUrl], shareDir2);
  configureRepo(shareDir2);
  ok(`share uses the share key (${sshUrl})`);
  return 0;
}
var keyPath2, KEY, httpsUrl, sshCommand, configureRepo, usesKey;
var init_sharekey = __esm({
  "src/sharekey.ts"() {
    "use strict";
    init_git();
    init_github();
    init_paths();
    init_ui();
    keyPath2 = () => !existsSync16(shareKeyDefault()) && existsSync16(legacyShareKey()) ? legacyShareKey() : shareKeyDefault();
    KEY = () => contract(keyPath2());
    httpsUrl = (o, r2) => `https://github.com/${o}/${r2}.git`;
    sshCommand = () => `ssh -i ${KEY()} -o IdentitiesOnly=yes`;
    configureRepo = (shareDir2) => git(["config", "core.sshCommand", sshCommand()], shareDir2);
    usesKey = (shareDir2) => configGet(shareDir2, "core.sshCommand") === sshCommand();
  }
});

// src/remove.ts
var remove_exports = {};
__export(remove_exports, {
  orphans: () => orphans,
  remove: () => remove,
  secretsFiles: () => secretsFiles
});
import { existsSync as existsSync17, readdirSync as readdirSync9, rmSync as rmSync8 } from "node:fs";
import { join as join21, relative as relative8 } from "node:path";
function secretsFiles(share, name2) {
  return secretEntries(share.path).filter((e) => fileOf(name2, e) && (e === name2 || !share.manifest.projects[e])).map((e) => join21(secretsDir(share.path), `${e}.env`));
}
function orphans(share) {
  const repo = share.path, man = share.manifest;
  const names = /* @__PURE__ */ new Set(), state = /* @__PURE__ */ new Set();
  const registered = Object.keys(man.projects);
  const st = statesDir(share);
  if (existsSync17(st)) {
    for (const e of readdirSync9(st, { withFileTypes: true })) if (e.isDirectory() && !man.projects[e.name]) {
      names.add(e.name);
      state.add(e.name);
    }
  }
  for (const e of secretEntries(repo)) if (!registered.some((p) => fileOf(p, e))) names.add(e);
  return [...names].filter((n3) => state.has(n3) || ![...names].some((o) => o !== n3 && fileOf(o, n3))).sort();
}
function resolve6(share, names) {
  const repo = share.path, man = share.manifest;
  const known = [.../* @__PURE__ */ new Set([...Object.keys(man.projects), ...orphans(share)])].sort();
  const ws = workspace2(share);
  return names.map((name2) => {
    if (!NAME_RE.test(name2)) throw new Error(`cs: '${name2}' is not a project name`);
    const project = man.projects[name2];
    const state = projectState(share, name2);
    const t2 = { name: name2, project, state: existsSync17(state) ? state : void 0, secrets: secretsFiles(share, name2), here: project ? dirs(project, ws) : [] };
    if (!t2.project && !t2.state && !t2.secrets.length) throw new Error(`cs: unknown project '${name2}'
known: ${known.join(", ") || "(none)"}`);
    return t2;
  });
}
async function warnings(t2, ws) {
  if (t2.secrets.length) warn(`${t2.name}: .env values stored in the share go with it \u2014 the checkout's own .env files stay`);
  if (!t2.project?.url) return;
  const c2 = locate(t2.project, ws);
  if (present(c2)) {
    for (const h2 of (await fetchWaiting(c2, { fetch: false })).list) warn(`${t2.name}: a handoff from ${h2.machine} (${h2.branch}) is waiting on the remote \u2014 it stays there, the remote is not touched`);
  } else warn(`${t2.name}: no checkout here to look for waiting handoffs \u2014 one left on the remote stays there (cs handoffs on a machine that has it)`);
}
function summary(t2, manifestText2) {
  const lines = [];
  if (t2.project) lines.push(`goes   manifest entry  ${dim(subTables(manifestText2, t2.name).join(" "))}`);
  if (t2.state) lines.push(`goes   project state   ${dim(`projects/${t2.name}/ (${countFiles(t2.state)} files, memory included)`)}`);
  for (const f of t2.secrets) lines.push(`goes   secrets         ${dim(`secrets/projects/${f.split("/").pop()}`)}`);
  for (const c2 of t2.here) lines.push(`kept   checkout        ${dim(contract(c2))}`);
  if (!t2.here.length) lines.push(`kept   checkout        ${dim("none on this machine")}`);
  if (t2.project?.url) lines.push(`kept   remote          ${dim(t2.project.url)}`);
  return lines;
}
async function remove(share, names, o = {}) {
  const repo = share.path;
  const targets = resolve6(share, [...new Set(names)]);
  const ws = workspace2(share);
  const text3 = manifestText(share);
  for (const t2 of targets) note2(summary(t2, text3), t2.name);
  for (const t2 of targets) await warnings(t2, ws);
  const label = targets.map((t2) => t2.name).join(", ");
  if (!o.yes) {
    if (!canAsk()) throw new Error(`cs: no terminal to confirm
add --yes to remove ${label} unattended`);
    if (!await confirm2(`remove ${label} from the share? (checkouts and remotes stay)`, false)) return dim("nothing removed");
  }
  const paths = [];
  for (const t2 of targets) {
    if (removeProject(share, t2.name)) paths.push("projects.toml");
    if (t2.state) {
      rmSync8(t2.state, { recursive: true, force: true });
      paths.push(relative8(repo, t2.state));
    }
    for (const f of t2.secrets) {
      rmSync8(f, { force: true });
      paths.push(relative8(repo, f));
    }
    steps(forget(t2.name, t2.here));
  }
  const sha = o.noCommit ? "" : commit2(share, `remove ${label}`, [...new Set(paths)]) ?? "";
  ok(`removed ${label} from the share${sha ? `  ${dim(`commit ${sha}`)}` : dim(o.noCommit ? "  (not committed: --no-commit)" : "  (nothing to commit \u2014 the share had none of it committed)")}`);
  for (const t2 of targets) {
    for (const c2 of t2.here) info(`${t2.name}: checkout kept at ${contract(c2)} \u2014 just a directory now, yours to keep or rm`);
    if (t2.project?.url) {
      const [, gh] = parseRepoUrl(t2.project.url);
      info(dim(gh ? `${t2.name}: the GitHub repo stays \u2014 to delete it too, by hand: gh repo delete ${gh[0]}/${gh[1]}` : `${t2.name}: the remote stays \u2014 ${t2.project.url}`));
    }
  }
  return sha ? dim(`undo: git -C ${contract(repo)} revert ${sha}, then cs sync everywhere`) : dim("the share pushes with the next cs sync");
}
var secretsDir, secretEntries, countFiles, subTables;
var init_remove = __esm({
  "src/remove.ts"() {
    "use strict";
    init_paths();
    init_manifest();
    init_share();
    init_checkout();
    init_projectstate();
    init_env();
    init_sharekey();
    init_ui();
    secretsDir = (repo) => join21(repo, "secrets", "projects");
    secretEntries = (repo) => existsSync17(secretsDir(repo)) ? readdirSync9(secretsDir(repo)).filter((f) => f.endsWith(".env")).map((f) => f.slice(0, -4)).sort() : [];
    countFiles = (dir) => readdirSync9(dir, { withFileTypes: true }).reduce((n3, e) => n3 + (e.isDirectory() ? countFiles(join21(dir, e.name)) : e.isFile() && e.name !== ".gitkeep" ? 1 : 0), 0);
    subTables = (text3, name2) => [...text3.matchAll(projectTableRe(name2, "gm"))].map((m) => m[0].replace(/\s*(#.*)?$/, ""));
  }
});

// src/secretscmd.ts
var secretscmd_exports = {};
__export(secretscmd_exports, {
  diff: () => diff,
  edit: () => edit2,
  ensureRecipient: () => ensureRecipient,
  environment: () => environment,
  exec: () => exec3,
  get: () => get,
  init: () => init,
  pull: () => pull,
  push: () => push2,
  recovery: () => recovery,
  setValues: () => setValues,
  status: () => status2,
  trust: () => trust,
  unsetValues: () => unsetValues,
  untrust: () => untrust
});
import { chmodSync as chmodSync6, existsSync as existsSync18, mkdirSync as mkdirSync17, readdirSync as readdirSync10, readFileSync as readFileSync19, writeFileSync as writeFileSync15, rmSync as rmSync9 } from "node:fs";
import { join as join22, relative as relative9 } from "node:path";
import { spawnSync as spawnSync7 } from "node:child_process";
async function init(share, interactive = true) {
  await (await getBackend(share.machine)).init(share, interactive);
  return 0;
}
async function status2(share) {
  info(bold(`secrets backend: ${share.machine.secretsBackend}`));
  (await getBackend(share.machine)).status(share);
  return 0;
}
async function edit2(share, name2) {
  (await getBackend(share.machine)).edit(share.path, name2);
  commitSecrets(share, `secrets: edit ${name2}`);
  return 0;
}
async function setValues(share, name2, pairs) {
  const repo = share.path;
  const b = await getBackend(share.machine);
  await spin(`encrypting ${name2}\u2026`, async () => {
    const v = b.loadEnv(repo, name2);
    for (const p of pairs) {
      const i2 = p.indexOf("=");
      if (i2 < 1) throw new Error(`cs: expected KEY=VALUE, got '${p}'`);
      v[p.slice(0, i2).trim()] = p.slice(i2 + 1);
    }
    b.writeEnv(repo, name2, v);
    commitSecrets(share, `secrets: set ${pairs.length} value(s) in ${name2}`);
  });
  ok(`${name2}: ${pairs.map((p) => p.split("=")[0]).join(", ")} stored (encrypted)`);
  return 0;
}
async function unsetValues(share, name2, keys) {
  const repo = share.path;
  const b = await getBackend(share.machine);
  const v = b.loadEnv(repo, name2);
  for (const k of keys) delete v[k];
  b.writeEnv(repo, name2, v);
  commitSecrets(share, `secrets: unset ${keys.length} value(s) in ${name2}`);
  return 0;
}
async function get(share, name2, key, show) {
  const v = (await getBackend(share.machine)).loadEnv(share.path, name2);
  if (key) {
    if (!(key in v)) return 1;
    console.log(show ? v[key] : mask2(v[key]));
    return 0;
  }
  for (const [k, val] of Object.entries(v)) console.log(`${k}=${show ? val : mask2(val)}`);
  return 0;
}
async function pull(share, project, force) {
  const repo = share.path, m = share.machine;
  const p = share.manifest.projects[project];
  if (!p) throw new Error(`cs: unknown project '${project}'`);
  const v = (await getBackend(m)).loadEnv(repo, project);
  if (!Object.keys(v).length) {
    warn(`no secrets stored for ${project} (cs secrets push ${project} / cs secrets set ${project} K=V)`);
    return 1;
  }
  const root = checkoutRoot(p, workspace2(share)), target = join22(root, ".env"), text3 = dumpDotenv(v);
  if (existsSync18(target) && readFileSync19(target, "utf8") !== text3 && !force) {
    fail(`${contract(target)} exists and differs \u2014 cs secrets diff ${project}; use --force to overwrite`);
    return 1;
  }
  writeFileSync15(target, text3);
  chmodSync6(target, 384);
  checkIgnored(root, target);
  ok(`wrote ${contract(target)} (${Object.keys(v).length} keys)`);
  return 0;
}
async function push2(share, project) {
  const repo = share.path, m = share.machine;
  const p = share.manifest.projects[project];
  if (!p) throw new Error(`cs: unknown project '${project}'`);
  const root = checkoutRoot(p, workspace2(share)), src = join22(root, ".env");
  if (!existsSync18(src)) throw new Error(`cs: ${contract(src)} not found`);
  const v = parseDotenv(readFileSync19(src, "utf8"));
  (await getBackend(m)).writeEnv(repo, project, v);
  commitSecrets(share, `secrets: ${project} .env`);
  checkIgnored(root, src);
  ok(`${project}: ${Object.keys(v).length} keys encrypted into ${contract(envFile(repo, project))}`);
  return 0;
}
async function diff(share, project) {
  const p = share.manifest.projects[project];
  if (!p) throw new Error(`cs: unknown project '${project}'`);
  const stored = (await getBackend(share.machine)).loadEnv(share.path, project);
  const lf = join22(checkoutRoot(p, workspace2(share)), ".env");
  const local = existsSync18(lf) ? parseDotenv(readFileSync19(lf, "utf8")) : {};
  const rows = [.../* @__PURE__ */ new Set([...Object.keys(stored), ...Object.keys(local)])].sort().filter((k) => stored[k] !== local[k]).map((k) => [k, k in stored ? mask2(stored[k]) : dim("-"), k in local ? mask2(local[k]) : dim("-")]);
  if (rows.length) {
    table(rows, ["key", "stored", "local .env"]);
    return 1;
  }
  ok("no differences");
  return 0;
}
async function environment(share, project, warnMissing = true) {
  const env2 = { ...process.env };
  if (env2.CS_SECRETS_LOADED === "1") return env2;
  const repo = share.path;
  const b = await getBackend(share.machine);
  if (b.name !== "none" && !b.ready(repo)) {
    if (warnMissing) warn("secrets not available on this machine (cs secrets init / cs trust) \u2014 continuing without them");
    return env2;
  }
  Object.assign(env2, b.loadEnv(repo, "global"));
  if (project) Object.assign(env2, b.loadEnv(repo, project));
  env2.CS_SECRETS_LOADED = "1";
  return env2;
}
async function exec3(share, project, cmd) {
  if (!cmd.length) throw new Error("cs: secrets exec needs a command after --");
  project ??= projectForPath2(share, process.cwd())?.name;
  const env2 = await environment(share, project);
  const p = spawnSync7(cmd[0], cmd.slice(1), { stdio: "inherit", env: env2 });
  return p.status ?? 1;
}
async function trust(share, machine) {
  const repo = share.path;
  const pf = machinePubFile(repo, machine);
  if (!existsSync18(pf)) throw new Error(`cs: ${contract(pf)} not found \u2014 run cs secrets init on ${machine} and cs sync on both sides first`);
  const pub = readFileSync19(pf, "utf8").trim();
  const recs = recipients(repo);
  if (recs.includes(pub)) {
    ok(`${machine} is already a recipient`);
    return 0;
  }
  writeRecipients(repo, [...recs, pub]);
  const n3 = await spin("re-encrypting secrets for the new recipient\u2026", () => updatekeys(repo));
  commit2(share, `secrets: trust ${machine}`, [".sops.yaml", "secrets"]);
  ok(`${machine} can now decrypt  ${dim(`${n3} file(s) re-encrypted`)}`);
  return 0;
}
async function untrust(share, machine) {
  const repo = share.path, m = share.machine;
  const pf = machinePubFile(repo, machine);
  const pub = existsSync18(pf) ? readFileSync19(pf, "utf8").trim() : "";
  const recs = recipients(repo);
  if (pub && recs.includes(pub)) {
    writeRecipients(repo, recs.filter((r2) => r2 !== pub));
    const n3 = await spin("re-encrypting secrets without that machine\u2026", () => updatekeys(repo));
    rmSync9(join22(repo, "machines", machine), { recursive: true, force: true });
    commit2(share, `secrets: untrust ${machine}`, [".sops.yaml", "secrets", "machines"]);
    ok(`untrusted ${machine}; re-encrypted ${n3} file(s)`);
  } else warn(`${machine} was not a recipient`);
  const b = await getBackend(m);
  const keys = /* @__PURE__ */ new Set();
  for (const name2 of ["global", ...Object.keys(man_projects(repo))]) for (const k of Object.keys(b.loadEnv(repo, name2))) keys.add(k);
  if (keys.size) warn("that machine could read these \u2014 rotate them at the source: " + [...keys].sort().join(", "));
  return 0;
}
function man_projects(repo) {
  const d = join22(repo, "secrets", "projects");
  const out2 = {};
  if (existsSync18(d)) {
    for (const f of readdirSync10(d)) if (f.endsWith(".env")) out2[f.slice(0, -4)] = true;
  }
  return out2;
}
async function recovery(share) {
  const repo = share.path;
  const tmp = join22(home(), ".cache", `cs-recovery-${process.pid}.txt`);
  const exe2 = which("age-keygen") || join22(home(), ".local", "bin", "age-keygen");
  mkdirSync17(join22(home(), ".cache"), { recursive: true });
  const p = spawnSync7(exe2, ["-o", tmp], { encoding: "utf8" });
  if (p.status !== 0) throw new Error(`cs: age-keygen failed: ${(p.stderr || "").trim()}`);
  const text3 = readFileSync19(tmp, "utf8");
  rmSync9(tmp, { force: true });
  const pub = text3.split("\n").find((l2) => l2.startsWith("# public key:")).split(":")[1].trim();
  const priv = text3.split("\n").find((l2) => l2.startsWith("AGE-SECRET-KEY-"));
  const pf = machinePubFile(repo, "recovery");
  mkdirSync17(join22(repo, "machines", "recovery"), { recursive: true });
  writeFileSync15(pf, pub + "\n");
  writeRecipients(repo, [...recipients(repo), pub]);
  const n3 = await updatekeys(repo);
  commit2(share, "secrets: recovery recipient", [".sops.yaml", "secrets", "machines/recovery"]);
  ok(`recovery recipient added; re-encrypted ${n3} file(s)`);
  note2([priv, "", dim("On a bare machine: write it to ~/.config/sops/age/keys.txt, run cs secrets init, trust the machine's own key, delete it.")], "Store this in your password manager now \u2014 it is not saved anywhere else");
  return 0;
}
async function ensureRecipient(share, interactive) {
  const repo = share.path, m = share.machine;
  const b = await getBackend(m);
  if (b.name === "none" || b.ready(repo)) return true;
  const { existsSync: ex, readdirSync: rd } = await import("node:fs");
  const md = join22(repo, "machines");
  const others = ex(md) ? rd(md).filter((d) => d !== m.name && d !== "recovery" && recipients(repo).includes((() => {
    try {
      return readFileSync19(join22(md, d, "age.pub"), "utf8").trim();
    } catch {
      return "";
    }
  })())) : [];
  const where = others.length ? `on ${others.map((x) => bold(x)).join(" or ")}` : "on a machine that already has secrets";
  if (!interactive) {
    warn(`secrets: not a recipient yet \u2014 ${where}: cs sync && cs trust ${m.name} && cs sync; then cs sync here`);
    return false;
  }
  for (; ; ) {
    const choice = await select2("This machine cannot decrypt secrets yet. How do you want to enable it?", [
      { value: "trust", label: "Trust it from another machine", hint: "recommended \u2014 nothing secret is typed or copied" },
      { value: "recovery", label: "Use the recovery key", hint: "paste it once; it is discarded afterwards" },
      { value: "skip", label: "Skip for now", hint: "Claude runs without secrets until then" }
    ]);
    if (choice === "skip") return false;
    if (choice === "recovery") {
      const priv = await password2("recovery key (AGE-SECRET-KEY-\u2026)");
      if (!/^AGE-SECRET-KEY-1[A-Z0-9]+$/.test(priv.trim())) {
        warn("that does not look like an age secret key");
        continue;
      }
      const tmp = join22(home(), ".cache", `cs-recovery-${process.pid}.txt`);
      (await import("node:fs")).mkdirSync(join22(home(), ".cache"), { recursive: true });
      writeFileSync15(tmp, priv.trim() + "\n", { mode: 384 });
      const prev = process.env.SOPS_AGE_KEY_FILE;
      process.env.SOPS_AGE_KEY_FILE = tmp;
      try {
        const pub = publicKey.call(null);
        const own = readFileSync19(machinePubFile(repo, m.name), "utf8").trim();
        if (!recipients(repo).includes(own)) writeRecipients(repo, [...recipients(repo), own]);
        const n3 = await spin("re-encrypting secrets for this machine\u2026", () => updatekeys(repo));
        commit2(share, `secrets: trust ${m.name} (recovery key)`, [".sops.yaml", "secrets"]);
        ok(`trusted via the recovery key  ${dim(`${n3} file(s) re-encrypted`)}`);
        void pub;
      } catch (e) {
        fail(`could not trust: ${e.message}`);
        continue;
      } finally {
        if (prev === void 0) delete process.env.SOPS_AGE_KEY_FILE;
        else process.env.SOPS_AGE_KEY_FILE = prev;
        rmSync9(tmp, { force: true });
      }
      return b.ready(repo);
    }
    note2([`${where} run:`, "", `  ${bold(`cs sync && cs trust ${m.name} && cs sync`)}`, "", dim("that machine re-encrypts the secrets so this one can read them \u2014 no secret leaves either machine")], "Trust this machine");
    if (!await proceed("done on the other machine?", "Done \u2014 check now", "Skip for now")) return false;
    const { runShareSync: runShareSync2 } = await Promise.resolve().then(() => (init_sharesync(), sharesync_exports));
    await spin("syncing\u2026", () => runShareSync2(share, { pullOnly: true, timeout: 20 }));
    if (b.ready(repo)) {
      ok("this machine can decrypt secrets");
      return true;
    }
    warn("still not a recipient \u2014 did the other machine run cs sync after trusting it?");
  }
}
var mask2, commitSecrets, checkIgnored;
var init_secretscmd = __esm({
  "src/secretscmd.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_deps();
    init_share();
    init_checkout();
    init_secrets();
    init_sops();
    init_ui();
    mask2 = (v) => v.length > 8 ? v.slice(0, 3) + "\u2026" + v.slice(-2) : "\u2026";
    commitSecrets = (share, msg) => commit2(share, msg, ["secrets"]);
    checkIgnored = (root, f) => {
      if (isRepo(root) && git(["check-ignore", "-q", f], root, { check: false }).code !== 0) warn(`${relative9(root, f)} is NOT gitignored in ${contract(root)} \u2014 add it to .gitignore`);
    };
  }
});

// src/identity.ts
var identity_exports = {};
__export(identity_exports, {
  add: () => add2,
  ls: () => ls,
  rename: () => rename
});
import { existsSync as existsSync19, renameSync as renameSync3 } from "node:fs";
async function add2(share, id, o) {
  if (!NAME_RE.test(id)) throw new Error(`cs: '${id}' is not a valid identity id`);
  const ident2 = { id, name: o.name, email: o.email, owner: o.owner, sshKey: o.key };
  addIdentity(share, ident2);
  commit2(share, `identities: add ${id}`, ["projects.toml"]);
  step(`identity ${bold(id)}  ${dim(`${o.name} <${o.email}> \xB7 github.com/${o.owner} \xB7 key ${keyPath(ident2)}`)}`);
  const ch = [];
  applyGit(share.manifest, false, ch);
  if (ch.length) step("git identity includes updated");
  if (!existsSync19(expand(keyPath(ident2)))) info(`no key at ${keyPath(ident2)} yet \u2014 cs ssh setup generates and registers it`);
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
function rename(share, oldId, newId) {
  const man = share.manifest, repo = share.path;
  if (!man.identities[oldId]) throw new Error(`cs: unknown identity '${oldId}'`);
  if (man.identities[newId] || !NAME_RE.test(newId)) throw new Error(`cs: '${newId}' is taken or invalid`);
  const ident2 = man.identities[oldId];
  const n3 = Object.values(man.projects).filter((p) => p.identity === oldId).length;
  renameIdentity(share, oldId, newId);
  if (!ident2.sshKey) {
    for (const s of ["", ".pub"]) {
      const a2 = expand(`~/.ssh/cs/${oldId}${s}`), b = expand(`~/.ssh/cs/${newId}${s}`);
      if (existsSync19(a2)) renameSync3(a2, b);
    }
    step(`~/.ssh/cs/${oldId} \u2192 ~/.ssh/cs/${newId}`);
  }
  for (const d of out(["ls-files", `machines/*/ssh/${oldId}.pub`], repo).split("\n").filter(Boolean)) git(["mv", d, d.replace(`${oldId}.pub`, `${newId}.pub`)], repo);
  commit2(share, `identities: rename ${oldId} \u2192 ${newId}`, ["projects.toml"]);
  ok(`identity ${oldId} \u2192 ${newId} (${n3} projects updated)`);
  const ch = [];
  applyGit(share.manifest, false, ch);
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
      return [bold(i2.id), `${i2.name} <${i2.email}>`, i2.owner || dim("-"), existsSync19(key) ? keyPath(i2) : red(keyPath(i2) + " (missing)"), getToken(i2.owner) ? green("token \u2713") : dim("no token"), dim(`${n3} project${n3 === 1 ? "" : "s"}`)];
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
    init_share();
    init_apply();
    init_ui();
  }
});

// src/status.ts
var status_exports = {};
__export(status_exports, {
  runBare: () => runBare,
  runStatus: () => runStatus,
  unregisteredDirs: () => unregisteredDirs
});
import { existsSync as existsSync20, readdirSync as readdirSync11 } from "node:fs";
import { join as join23 } from "node:path";
function unregisteredDirs(ws, known) {
  if (!existsSync20(ws)) return [];
  return readdirSync11(ws, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith(".") && !known.has(d.name)).map((d) => d.name).sort().map((name2) => {
    const { root } = sniff(join23(ws, name2));
    return { name: name2, remote: isRepo(root) ? remoteUrl(root) : "" };
  });
}
function projectLine(f, machine) {
  const { bits, pending, stuck } = status(f, machine);
  return { state: (bits.length ? bits.map(paint).join("  ") : green("clean")) + (pending ? SYNC : ""), pending, stuck };
}
async function shareLine(repo, fetch2, timeout) {
  const row = (branch, state) => [bold("share"), "", branch, state];
  if (!isRepo(repo)) return { row: row("", red("not a git repo") + FIX), pending: false, broken: true };
  if (!remoteUrl(repo)) return { row: row(branchOf(repo), red("no remote") + FIX), pending: false, broken: true };
  const offline = fetch2 && (await spin("share: fetching\u2026", () => gitA(["fetch", "-q", "--prune", "origin"], repo, { check: false, timeout }))).code !== 0;
  const dirty = dirtyCount(repo);
  const [ahead, behind] = aheadBehind(repo) ?? [0, 0];
  const bits = [dirty ? yellow(`${dirty} dirty`) : "", ahead ? yellow(`\u2191${ahead} unpushed`) : "", behind ? yellow(`\u2193${behind} from other machines`) : "", offline ? dim("offline") : ""].filter(Boolean);
  const last = hooksStatus(repo).lastSync;
  const when2 = !last ? "never synced" : isNaN(Date.parse(last)) ? `last sync failed (${last})` : `synced ${ago(last)}`;
  const pending = dirty + ahead + behind > 0;
  return { row: row(branchOf(repo), (bits.length ? bits.join("  ") : green("clean")) + "  " + dim(when2) + (pending ? SYNC : "")), pending, broken: false };
}
async function runStatus(share, fetch2 = true, showAll = false, timeout = 10) {
  const repo = share.path, m = share.machine, man = share.manifest;
  const ws = workspace2(share);
  info(`${dim("profiles")} ${m.profiles.join(", ")}  ${dim("workspace")} ${contract(ws)}${fetch2 ? "" : dim("  (not fetched)")}`);
  const shareRow = await shareLine(repo, fetch2, timeout);
  const { facts, envSkipped } = await spin("fetching projects\u2026", () => gather(share, { timeout, fetch: fetch2 }));
  const byName = new Map(facts.map((f) => [f.checkout.project.name, f]));
  let pending = shareRow.pending, attention = shareRow.broken, stuck = false;
  const rows = [shareRow.row];
  const known = /* @__PURE__ */ new Set();
  for (const p of Object.values(man.projects)) {
    known.add(p.path || p.name);
    const sel = selected(p, m);
    if (!sel && !showAll) continue;
    const kind = dim(p.layout === "worktrees" ? "\u2442" : "");
    const f = byName.get(p.name);
    const c2 = sel && !f ? locate(p, ws) : void 0;
    if (!sel) rows.push([p.name, kind, "", dim("skipped (profile)")]);
    else if (f) {
      const line = projectLine(f, m.name);
      rows.push([p.name, kind, f.checkout.units[0]?.branch || red("DETACHED"), line.state]);
      pending ||= line.pending;
      stuck ||= line.stuck;
    } else if (!c2 || present(c2)) continue;
    else if (c2.why === "missing") {
      rows.push([p.name, kind, "", p.url ? red("missing here") + SYNC : red("no remote, not here") + dim(`  cs doctor --fix on the machine that has it \xB7 or cs remove ${p.name}`)]);
      if (p.url) pending = true;
      else attention = true;
    } else if (c2.why === "not a git repo") {
      rows.push([p.name, kind, "", red("not a git repo") + FIX]);
      attention = true;
    } else {
      rows.push([p.name, kind, branchOf(c2.root), red("no remote") + FIX]);
      attention = true;
    }
  }
  table(rows, ["project", "", "branch", "state"]);
  for (const s of envSkipped) warn(s);
  for (const d of unregisteredDirs(ws, known)) {
    warn(`${d.name}: ${d.remote ? "not registered" : "not registered, no remote"}  ${dim(`cs add ${contract(join23(ws, d.name))}`)}`);
    attention = true;
  }
  return { rc: pending || attention || stuck ? 1 : 0, next: pending ? "cs sync" : attention ? "cs doctor --fix" : void 0 };
}
async function runBare(share, fetch2) {
  const m = share.machine;
  const finish2 = await startUpdateCheck();
  intro2(`claude-share  ${dim(m.name)}`);
  const r2 = await runStatus(share, fetch2);
  process.exitCode = r2.rc;
  const tail = [r2.next ? yellow(`run: ${r2.next}`) : "", behindHint(await behindCount(finish2))].filter(Boolean);
  outro2(tail.length ? tail.join("  \xB7  ") : dim("cs sync \xB7 cs new <project> --<identity> \xB7 cs --help"));
}
var SYNC, FIX, branchOf, paint;
var init_status = __esm({
  "src/status.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_manifest();
    init_share();
    init_checkout();
    init_gather();
    init_hooks();
    init_update();
    init_plan();
    init_ui();
    SYNC = dim("  cs sync");
    FIX = dim("  cs doctor --fix");
    branchOf = (path) => currentBranch(path) || red("DETACHED");
    paint = (b) => b.kind === "offline" || b.kind === "disabled" ? dim(b.text) : b.kind === "skip" ? red(b.text) : yellow(b.text);
  }
});

// src/migrate.ts
import { existsSync as existsSync21, mkdirSync as mkdirSync18, readdirSync as readdirSync12, readFileSync as readFileSync20, renameSync as renameSync4, rmSync as rmSync10, writeFileSync as writeFileSync16 } from "node:fs";
import { join as join24 } from "node:path";
function findOldNames(share) {
  const repo = share.path, m = share.machine;
  const out2 = [];
  if (existsSync21(legacyShareKey()) && !existsSync21(shareKeyDefault()))
    out2.push({
      what: `share key ${contract(legacyShareKey())}`,
      move: `mv ${contract(legacyShareKey())} ${contract(shareKeyDefault())} (and .pub)`,
      apply: () => {
        for (const s of ["", ".pub"]) if (existsSync21(legacyShareKey() + s)) renameSync4(legacyShareKey() + s, shareKeyDefault() + s);
        if (isRepo(repo) && remoteUrl(repo)) configureRepo(repo);
      }
    });
  else if (existsSync21(legacyShareKey()) && existsSync21(shareKeyDefault()))
    out2.push({ what: `two share keys: ${contract(legacyShareKey())} and ${contract(shareKeyDefault())}`, move: `remove the one that is not registered as the share's deploy key (cs ssh share-key checks ${contract(shareKeyDefault())})` });
  else if (isRepo(repo) && remoteUrl(repo) && !usesKey(repo) && configGet(repo, "core.sshCommand").includes(contract(legacyShareKey())))
    out2.push({ what: `the share's core.sshCommand names ${contract(legacyShareKey())}`, move: `git -C ${contract(repo)} config core.sshCommand "ssh -i ${contract(keyPath2())} -o IdentitiesOnly=yes"`, apply: () => configureRepo(repo) });
  const mf = join24(repo, "projects.toml");
  const text3 = existsSync21(mf) ? readFileSync20(mf, "utf8") : "";
  if (/^\s*(kind|github_owner)\s*=/m.test(text3))
    out2.push({ what: "projects.toml keys `kind` / `github_owner`", move: "drop `kind = \u2026` lines, rename `github_owner` to `owner` (the next cs sync carries it)", apply: () => writeFileSync16(mf, text3.split("\n").filter((l2) => !/^\s*kind\s*=/.test(l2)).map((l2) => l2.replace(/^(\s*)github_owner(\s*=)/, "$1owner$2")).join("\n")) });
  const oldKeyInToml = machineTomlHas("repo");
  if (repo === legacyShareDir() || oldKeyInToml)
    out2.push({
      what: repo === legacyShareDir() ? `share checkout ${contract(legacyShareDir())}` : "machine.toml key `repo`",
      move: repo === legacyShareDir() ? `mv ${contract(legacyShareDir())} ${contract(shareDirDefault())}` : "rename the key to `share` in machine.toml",
      then: repo === legacyShareDir() ? "the ~/.claude links and every checkout's memory path are re-rendered (cs apply, cs link)" : void 0,
      apply: () => {
        let target = repo;
        if (repo === legacyShareDir() && !existsSync21(shareDirDefault())) {
          mkdirSync18(join24(shareDirDefault(), ".."), { recursive: true });
          renameSync4(legacyShareDir(), shareDirDefault());
          target = shareDirDefault();
        }
        if (oldKeyInToml || m.share) {
          m.share = m.share && expand(m.share) !== legacyShareDir() && expand(m.share) !== shareDirDefault() ? m.share : void 0;
          saveMachine(m);
        }
        if (target !== repo) {
          const changes = [];
          applyLinks(target, false, changes);
          placeAll({ ...share, path: target });
        }
      }
    });
  const st = stateDir(), inState = `(in ${contract(st)})`;
  if (existsSync21(join24(st, "last-config"))) out2.push({ what: "state file last-config", move: `mv last-config last-sync ${inState}`, apply: () => {
    if (existsSync21(join24(st, "last-sync"))) rmSync10(join24(st, "last-config"));
    else renameSync4(join24(st, "last-config"), join24(st, "last-sync"));
  } });
  if (existsSync21(join24(st, "link"))) out2.push({ what: "state directory link/", move: `mv link project-state ${inState}`, apply: () => mergeDir(join24(st, "link"), join24(st, "project-state")) });
  for (const f of ["sync-config.lock", "blocked-config", "handoff/pending"]) if (existsSync21(join24(st, f))) out2.push({ what: `state file ${f}`, move: `rm ${f} ${inState} \u2014 no longer read`, apply: () => rmSync10(join24(st, f), { force: true }) });
  const ws = workspace2(share);
  for (const p of selectedProjects2(share)) {
    const c2 = locate(p, ws);
    if (!present(c2)) continue;
    const root = c2.root;
    const at = (cmd) => `git -C ${contract(root)} ${cmd}`;
    const fetched = out(["for-each-ref", "--format=%(refname:short)", `refs/remotes/origin/${OLD_REF_NS}/`], root).split("\n").filter(Boolean).map((r2) => r2.replace(/^origin\//, ""));
    const remote = git(["ls-remote", "--heads", "origin", `refs/heads/${OLD_REF_NS}/*`], root, { check: false, timeout: 5 }).out.split("\n").filter(Boolean).map((l2) => l2.split(/\s+/)[1].replace(/^refs\/heads\//, ""));
    for (const short of [.../* @__PURE__ */ new Set([...fetched, ...remote])]) {
      const renamed = short.replace(new RegExp(`^${OLD_REF_NS}/`), `${REF_NS}/`);
      const track = `refs/remotes/origin/${short}`;
      out2.push({ what: `${p.name}: handoff ${short} on the remote`, move: `apply it with the cs that sent it, or rename it there: ${fetched.includes(short) ? "" : `${at(`fetch origin +refs/heads/${short}:${track}`)} && `}${at(`push origin ${track}:refs/heads/${renamed} :refs/heads/${short}`)} && ${at(`update-ref -d ${track}`)}` });
    }
    for (const short of out(["for-each-ref", "--format=%(refname:short)", `refs/heads/${OLD_REF_NS}/`], root).split("\n").filter(Boolean))
      out2.push({ what: `${p.name}: handoff ${short} here`, move: `a handoff that never reached the remote (the changes are still in the tree): ${at(`branch -D ${short}`)}` });
  }
  return out2;
}
function migrate(share) {
  const done = [];
  for (const o of findOldNames(share)) if (o.apply) {
    o.apply();
    done.push(`${o.what}: ${o.move}${o.then ? ` \u2014 ${o.then}` : ""}`);
  }
  share.path = shareDir(share.machine);
  reload(share);
  return done;
}
function machineTomlHas(key) {
  try {
    return key in parse(readFileSync20(machineFile(), "utf8"));
  } catch {
    return false;
  }
}
function mergeDir(from, to) {
  if (!existsSync21(to)) {
    renameSync4(from, to);
    return;
  }
  for (const f of readdirSync12(from)) if (!existsSync21(join24(to, f))) renameSync4(join24(from, f), join24(to, f));
  rmSync10(from, { recursive: true, force: true });
}
var OLD_REF_NS;
var init_migrate = __esm({
  "src/migrate.ts"() {
    "use strict";
    init_dist5();
    init_git();
    init_paths();
    init_machine();
    init_share();
    init_sharekey();
    init_checkout();
    init_apply();
    init_projectstate();
    OLD_REF_NS = "wip";
  }
});

// src/doctor.ts
var doctor_exports = {};
__export(doctor_exports, {
  fix: () => fix,
  remoteless: () => remoteless,
  runDoctor: () => runDoctor
});
import { existsSync as existsSync22, lstatSync as lstatSync2, readdirSync as readdirSync13, readFileSync as readFileSync21 } from "node:fs";
import { join as join25 } from "node:path";
function remoteless(share) {
  const ws = workspace2(share);
  const man = share.manifest;
  const projects = selectedProjects2(share).filter((p) => {
    const c2 = locate(p, ws);
    return present(c2) ? !p.url : c2.why !== "missing";
  });
  return { projects, dirs: unregisteredDirs(ws, new Set(Object.values(man.projects).map((p) => p.path || p.name))) };
}
async function fix(share) {
  for (const d of migrate(share)) ok(d);
  const ws = workspace2(share);
  const { projects, dirs: dirs2 } = remoteless(share);
  for (const p of projects) {
    if (!canAsk()) {
      warn(`${p.name}: no remote \u2014 run cs doctor --fix in a terminal to create one`);
      continue;
    }
    if (await confirm2(`${p.name} has no remote \u2014 create a private GitHub repo and push it?`, true)) await fixRemote(share, p);
  }
  for (const d of dirs2) {
    const path = join25(ws, d.name);
    if (!canAsk()) {
      warn(`${d.name}: not registered \u2014 cs add ${contract(path)}`);
      continue;
    }
    if (await confirm2(`${d.name} is not registered \u2014 register it${d.remote ? "" : " (creating a private GitHub repo)"}?`, true)) {
      try {
        await add(share, path, { profiles: [], description: "", noCommit: false });
      } catch (e) {
        fail(e.message);
      }
    }
  }
  for (const p of selectedProjects2(share)) {
    const c2 = locate(p, ws);
    if (!present(c2) || !p.url) continue;
    const root = c2.root;
    const url = remoteUrl(root);
    if (url === p.url) continue;
    const cur = canonicalGithub(url), want = canonicalGithub(p.url);
    let same = cur === want;
    const ident2 = p.identity ? share.manifest.identities[p.identity] : void 0;
    if (!same && ident2 && identityMatches(ident2, cur) && cur.split("/").pop() === want.split("/").pop()) same = true;
    if (same) {
      git(["remote", "set-url", "origin", p.url], root);
      ok(`${p.name}: remote url ${url} \u2192 ${p.url}`);
    } else warn(`${p.name}: remote ${url} is a different repo than manifest ${p.url}; not changing it`);
  }
}
async function runDoctor(share, doFix = false, compact = false) {
  if (doFix) await fix(share);
  const repo = share.path, m = share.machine, man = share.manifest;
  const res = [];
  refuseUnsupported();
  res.push(["ok", describe()]);
  res.push(["ok", `node ${process.versions.node}`]);
  const v = version();
  res.push(v[0] > 2 || v[0] === 2 && v[1] >= 36 ? ["ok", `git ${v.join(".")}`] : ["warn", `git ${v.join(".")} < 2.36: identities fall back to per-repo config`]);
  res.push(which("claude") ? ["ok", `claude at ${which("claude")}`] : ["warn", "claude not on PATH (curl -fsSL https://claude.ai/install.sh | bash)"]);
  const ws = workspace2(share);
  res.push(isWSL() && ws.startsWith("/mnt/") ? ["fail", `workspace ${ws} is on the Windows filesystem; use the WSL home`] : ["ok", `workspace ${contract(ws)}`]);
  const broken = LINKS.filter((i2) => {
    try {
      return lstatSync2(join25(claudeDir(), i2)).isSymbolicLink() && !existsSync22(join25(claudeDir(), i2));
    } catch {
      return false;
    }
  });
  res.push(broken.length ? ["fail", "broken links in ~/.claude: " + broken.join(", ") + "  (cs apply)"] : ["ok", "~/.claude links healthy"]);
  const ch = [];
  applySettings(share, true, ch);
  res.push(ch.length ? ["warn", "settings.json drift: " + ch.join("; ") + "  (cs apply)"] : ["ok", "settings.json rendered"]);
  if (existsSync22(claudeJson())) {
    try {
      const d = JSON.parse(readFileSync21(claudeJson(), "utf8"));
      const hits = [];
      for (const [path, e] of Object.entries(d.projects ?? {})) for (const [n3, c2] of Object.entries(e.mcpServers ?? {})) if (c2.env || c2.headers) hits.push(`${n3}@${contract(path)}`);
      res.push(hits.length ? ["warn", `local-scope MCP servers with secrets in ~/.claude.json (machine-only): ${hits.join(", ")} \u2014 keep until cs secrets provides the \${VAR}s, then \`claude mcp remove <name> -s local\``] : ["ok", "no secret-bearing local-scope MCP servers"]);
    } catch {
      res.push(["warn", "~/.claude.json unparsable"]);
    }
  }
  res.push(process.env.GH_TOKEN || process.env.GITHUB_TOKEN ? ["warn", "GH_TOKEN/GITHUB_TOKEN is exported in this shell; gh ignores its stored logins while set"] : ["ok", "no GH_TOKEN override in env"]);
  const idr = [];
  for (const p of selectedProjects2(share)) {
    const c2 = locate(p, ws);
    if (!present(c2) && c2.why !== "no remote") continue;
    const root = c2.root;
    const ident2 = p.identity ? man.identities[p.identity] : void 0;
    const email2 = configGet(root, "user.email");
    const url = remoteUrl(root);
    if (p.url && canonicalGithub(url) !== canonicalGithub(p.url)) idr.push(["warn", `${p.name}: remote ${url} \u2260 manifest ${p.url}  (cs doctor --fix)`]);
    else if (url && p.url && url !== p.url) idr.push(["warn", `${p.name}: remote uses alias/other form ${url}; manifest ${p.url}  (cs doctor --fix)`]);
    if (ident2 && email2 !== ident2.email) idr.push(["fail", `${p.name}: user.email resolves to '${email2 || "UNSET"}', expected ${ident2.email}`]);
  }
  res.push(...idr.length ? idr : [["ok", "git identities resolve per manifest"]]);
  const hs = hooksStatus(repo);
  res.push(hs.complete ? ["ok", `hooks installed (${HOOK_EVENTS.join(", ")})`] : ["warn", `hooks ${hs.events.length ? "outdated" : "not installed"}  (cs sync re-installs them)`]);
  res.push(hs.timerActive ? ["ok", "timer active (share sync every 15 min)"] : hs.timerFiles ? ["warn", "timer installed but not active  (cs sync re-installs it)"] : ["warn", "timer not installed  (cs sync installs it)"]);
  res.push(hs.lastSync ? ["ok", `last share sync ${ago(hs.lastSync)}`] : ["warn", "the share has never synced here  (cs sync)"]);
  if (m.secretsBackend !== "none" && existsSync22(join25(repo, ".sops.yaml"))) {
    const machines = existsSync22(join25(repo, "machines")) ? readdirSync13(join25(repo, "machines")).filter((d) => existsSync22(join25(repo, "machines", d, "age.pub"))) : [];
    if (!machines.includes("recovery")) res.push(["warn", "secrets have no recovery key \u2014 cs secrets recovery (print it once, keep it in your password manager)"]);
    const others = machines.filter((d) => d !== m.name && d !== "recovery");
    if (others.length) res.push(["ok", `machines trusted with the secrets: ${others.join(", ")}  (cs untrust <machine> when one is retired)`]);
  }
  const old = findOldNames(share);
  for (const o of old) res.push(["warn", `old name \u2014 ${o.what}: ${o.move}${o.then ? `; ${o.then}` : ""}  ${o.apply ? "(cs doctor --fix; docs/MIGRATION.md)" : "(by hand; docs/MIGRATION.md)"}`]);
  if (!old.length) res.push(["ok", "on-disk names current (share key, share, handoffs, state)"]);
  const rl = remoteless(share);
  for (const p of rl.projects) res.push(["fail", `${p.name}: no remote  (cs doctor --fix \xB7 or cs remove ${p.name})`]);
  for (const d of rl.dirs) res.push(["warn", `${contract(join25(ws, d.name))}: not registered${d.remote ? "" : ", no remote"}  (cs add ${contract(join25(ws, d.name))})`]);
  if (!rl.projects.length && !rl.dirs.length) res.push(["ok", "every project has a remote; nothing unregistered under the workspace"]);
  const left = orphans(share);
  for (const n3 of left) res.push(["warn", `${n3}: state/secrets in the share but not registered  (cs remove ${n3})`]);
  if (!left.length) res.push(["ok", "the share holds state and secrets for registered projects only"]);
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
    init_share();
    init_checkout();
    init_apply();
    init_ui();
    init_deps();
    init_status();
    init_plan();
    init_hooks();
    init_projects();
    init_migrate();
    init_remove();
    LINKS = ["CLAUDE.md", "rules", "agents", "themes", "keybindings.json", "plans"];
  }
});

// src/ssh.ts
var ssh_exports = {};
__export(ssh_exports, {
  githubUserForKey: () => githubUserForKey,
  setup: () => setup2,
  writeSshConfig: () => writeSshConfig
});
import { chmodSync as chmodSync7, existsSync as existsSync23, mkdirSync as mkdirSync19, readFileSync as readFileSync22, writeFileSync as writeFileSync17 } from "node:fs";
import { dirname as dirname9, join as join26 } from "node:path";
import { spawnSync as spawnSync8 } from "node:child_process";
function keygen2(key, comment) {
  mkdirSync19(dirname9(key), { recursive: true, mode: 448 });
  const p = spawnSync8("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-C", comment, "-f", key]);
  if (p.status !== 0) throw new Error("cs: ssh-keygen failed");
  chmodSync7(key, 384);
}
async function githubUserForKey(key) {
  if (process.env.CS_OFFLINE) return void 0;
  const { exec: exec4 } = await Promise.resolve().then(() => (init_proc(), proc_exports));
  const p = await exec4("ssh", ["-T", "-i", key, "-o", "IdentitiesOnly=yes", "-o", "StrictHostKeyChecking=accept-new", "-o", "BatchMode=yes", "git@github.com"], { timeout: 20 });
  return (p.out + p.err).match(/Hi ([^!]+)!/)?.[1];
}
function writeSshConfig() {
  const cfg = join26(home(), ".ssh", "config");
  const text3 = existsSync23(cfg) ? readFileSync22(cfg, "utf8") : "";
  const block3 = [MARK, "Host github.com", "    IdentitiesOnly yes", "    AddKeysToAgent yes", ...isMac() ? ["    UseKeychain yes"] : [], END].join("\n") + "\n";
  const next = text3.includes(MARK) ? text3.slice(0, text3.indexOf(MARK)) + block3 + text3.slice(text3.indexOf(END) + END.length + 1) : block3 + (text3 && !text3.startsWith("\n") ? "\n" : "") + text3;
  if (next === text3) return false;
  mkdirSync19(dirname9(cfg), { recursive: true, mode: 448 });
  writeFileSync17(cfg, next);
  chmodSync7(cfg, 384);
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
async function setup2(share, checkOnly = false) {
  const repo = share.path, m = share.machine;
  const ids = Object.values(share.manifest.identities);
  if (!ids.length) {
    warn("no identities yet (cs identity add \u2026)");
    return 0;
  }
  const rows = [];
  const published = [];
  const unregistered = [];
  for (const i2 of ids) {
    const key = expand(keyPath(i2)), pubf = key + ".pub";
    const state = [];
    if (!existsSync23(key)) {
      if (checkOnly) {
        rows.push([i2.id, keyPath(i2), red("missing")]);
        unregistered.push(i2);
        continue;
      }
      keygen2(key, `cs:${m.name}:${i2.id}`);
      state.push(green("generated"));
    }
    const pub = readFileSync22(pubf, "utf8").trim();
    const dest = join26(repo, "machines", m.name, "ssh", `${i2.id}.pub`);
    if (!checkOnly && (!existsSync23(dest) || readFileSync22(dest, "utf8").trim() !== pub)) {
      mkdirSync19(dirname9(dest), { recursive: true });
      writeFileSync17(dest, pub + "\n");
      published.push(dest);
    }
    let user = await spin(`verifying ${i2.id} key on GitHub\u2026`, () => githubUserForKey(key));
    if (user) state.push(green(`github: ${user}`));
    else if (!checkOnly) {
      const r2 = await spin(`registering ${i2.id} key\u2026`, () => register(i2, pub, `cs:${m.name}:${i2.id}`));
      user = await githubUserForKey(key);
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
  if (published.length) commit2(share, `machines: ${m.name} ssh public keys`, published);
  if (!checkOnly && writeSshConfig()) step("~/.ssh/config: managed block (IdentitiesOnly, AddKeysToAgent)");
  table(rows, ["identity", "key", "state"]);
  for (const i2 of unregistered) {
    const pubf = expand(keyPath(i2)) + ".pub";
    if (!existsSync23(pubf)) continue;
    const who = i2.owner && i2.owner.toLowerCase() !== i2.id.toLowerCase() ? `the ${i2.owner} account` : `your GitHub account that is a member of ${i2.owner || "the org"}`;
    note2([`${cyan("https://github.com/settings/ssh/new")}  ${dim(`\u2192 logged in as ${who}`)}`, "", `title  ${bold(`cs:${m.name}:${i2.id}`)}`, `key    ${bold(readFileSync22(pubf, "utf8").trim())}`], `Add the ${i2.id} key`);
  }
  return unregistered.length ? 1 : 0;
}
var MARK, END;
var init_ssh = __esm({
  "src/ssh.ts"() {
    "use strict";
    init_github();
    init_paths();
    init_platform();
    init_manifest();
    init_share();
    init_ui();
    MARK = "# >>> claude-share >>>";
    END = "# <<< claude-share <<<";
  }
});

// src/init.ts
var init_exports = {};
__export(init_exports, {
  PHASES: () => PHASES,
  SHARE_REPO_NAME: () => SHARE_REPO_NAME,
  init: () => init2,
  newShare: () => newShare
});
import { copyFileSync as copyFileSync5, existsSync as existsSync24, mkdirSync as mkdirSync20, readdirSync as readdirSync14, writeFileSync as writeFileSync18 } from "node:fs";
import { dirname as dirname10, join as join27, relative as relative10 } from "node:path";
function newShare(dest, branch = "master") {
  const src = templatesDir() + "/share";
  mkdirSync20(dest, { recursive: true });
  const copy = (d) => {
    for (const e of readdirSync14(d, { withFileTypes: true })) {
      const f = join27(d, e.name), t2 = join27(dest, relative10(src, f));
      if (e.isDirectory()) {
        mkdirSync20(t2, { recursive: true });
        copy(f);
      } else if (!existsSync24(t2)) {
        mkdirSync20(dirname10(t2), { recursive: true });
        copyFileSync5(f, t2);
      }
    }
  };
  copy(src);
  for (const d of ["plans", "projects", "secrets", "claude/skills", "claude/rules", "claude/agents", "machines"]) {
    mkdirSync20(join27(dest, d), { recursive: true });
    if (!readdirSync14(join27(dest, d)).length) writeFileSync18(join27(dest, d, ".gitkeep"), "");
  }
  if (!isRepo(dest)) git(["init", "-q", "-b", branch], dest);
  git(["add", "-A"], dest);
  if (isDirty(dest) || !out(["rev-parse", "--verify", "-q", "HEAD"], dest)) commit(dest, "claude-share config skeleton");
  return dest;
}
async function accessLoop(sshUrl, gh, interactive, machine) {
  const { pub, created } = ensureKey(machine);
  if (created) step(`share key generated  ${dim(KEY())}`);
  let [ok2, err] = await spin("checking access to the share\u2026", () => canAccess(sshUrl));
  let tries = 0;
  while (!ok2) {
    instructions(pub, gh, machine);
    if (!interactive) throw new Error("cs: share not reachable with the share key (see instructions above)");
    if (!await proceed("added the key?", "Done \u2014 check access", "Abort") || tries++ >= 10) throw new Error("cs: aborted \u2014 share not reachable");
    [ok2, err] = await spin("checking access\u2026", () => canAccess(sshUrl));
    if (!ok2) warn(`still no access \u2014 ${err}`);
  }
  step("share reachable with the share key");
}
async function cloneConfig(sshUrl, target) {
  mkdirSync20(dirname10(target), { recursive: true });
  await spin("cloning the share\u2026", () => gitA(["clone", "-q", sshUrl, target], void 0, { sshKey: keyPath2() }));
  configureRepo(target);
  step(`share cloned to ${dim(contract(target))}`);
}
async function askUrl(prompt) {
  for (; ; ) {
    const raw = await text2(prompt, { placeholder: "https://github.com/<owner>/claude-share-config", validate: (v) => v.trim() ? void 0 : "a URL is required" });
    const [sshUrl, gh] = parseRepoUrl(raw);
    if (gh) {
      const vis = await spin("looking up the repository\u2026", () => isPublic(httpsUrl(...gh)));
      if (vis === true) step(`${gh[0]}/${gh[1]} found (public)`);
      else if (vis === false) step(`${gh[0]}/${gh[1]} found (private) \u2014 access via the share key`);
      else {
        warn(`${gh[0]}/${gh[1]} not found or unreachable`);
        if (!await confirm2("use this URL anyway?", false)) continue;
      }
    }
    return [sshUrl, gh];
  }
}
async function join_(target, interactive, machine, repoUrl2 = "") {
  if (existsSync24(target) && isRepo(target)) {
    skip(`share already at ${contract(target)}`);
    configureRepo(target);
    return;
  }
  const [sshUrl, gh] = repoUrl2 ? parseRepoUrl(repoUrl2) : await askUrl("share URL");
  await accessLoop(sshUrl, gh, interactive, machine);
  await cloneConfig(sshUrl, target);
}
async function create2(target, interactive, machine) {
  const n3 = await text2("name for your new share", { default: SHARE_REPO_NAME, validate: name });
  note2([cyan("https://github.com/new"), dim("no README, no .gitignore, no license \u2014 completely empty")], `Create an empty PRIVATE repository named '${n3}' on GitHub`);
  const [sshUrl, gh] = await askUrl("paste the new repo's URL");
  await accessLoop(sshUrl, gh, interactive, machine);
  newShare(target);
  if (!remoteUrl(target)) git(["remote", "add", "origin", sshUrl], target);
  configureRepo(target);
  await spin("pushing the initial share\u2026", () => gitA(["push", "-q", "-u", "origin", currentBranch(target)], target));
  step(`share initialized and pushed  ${dim(sshUrl)}`);
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
  const md = join27(repo, "machines");
  const existing = existsSync24(md) ? readdirSync14(md, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== "recovery").map((d) => d.name).sort() : [];
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
        (groups[g] ??= []).push({ value: p.name, label: p.name, hint: p.url ? `${p.identity} \xB7 ${p.url.replace(/^git@github\.com:/, "").replace(/\.git$/, "")}` : "no remote yet" });
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
      { value: "default", label: `${dws}  (recommended)`, hint: existsSync24(expand(dws)) ? "exists" : "will be created" },
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
    const existed = existsSync24(expand(w));
    mkdirSync20(expand(w), { recursive: true });
    step(`projects live in ${bold(w)}${existed ? "" : dim("  (created)")}`);
    workspaceOverride = w === dws ? void 0 : w;
  } else if (ws) mkdirSync20(expand(ws), { recursive: true });
  const m = { name: nm, profiles, exclude, workspace: workspaceOverride, secretsBackend: "sops" };
  saveMachine(m);
  return m;
}
async function firstIdentity(share, interactive) {
  if (Object.keys(share.manifest.identities).length) return;
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
  await add2(share, id, { owner: own, name: nm, email: em, noToken: true });
}
async function keysAndTokens(share, interactive, skip2) {
  const full = share.manifest;
  if (!Object.keys(full.identities).length) return;
  const used = new Set(selectedProjects2(share).map((p) => p.identity).filter(Boolean));
  const man = used.size ? { ...full, identities: Object.fromEntries(Object.entries(full.identities).filter(([id]) => used.has(id))) } : full;
  const narrowed = { ...share, manifest: man };
  const skipped = Object.keys(full.identities).filter((id) => !(id in man.identities));
  if (skipped.length) skip(`identities not needed by the selected projects: ${skipped.join(", ")}`);
  if (!skip2.includes("ssh")) {
    section("identity ssh keys");
    const ssh = await Promise.resolve().then(() => (init_ssh(), ssh_exports));
    let rc = await ssh.setup(narrowed);
    let tries = 0;
    while (rc !== 0 && interactive && tries++ < 5) {
      if (!await proceed("added the key(s) on GitHub?", "Done \u2014 verify", "Skip for now")) break;
      rc = await ssh.setup(narrowed, true);
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
function push3(repo) {
  if (!remoteUrl(repo)) return;
  const ab = aheadBehind(repo);
  if (ab === void 0 || ab[0]) {
    const r2 = git(["push", "-q", "-u", "origin", currentBranch(repo)], repo, { check: false, timeout: 60 });
    r2.code === 0 ? ok("share pushed") : fail(`push failed: ${r2.err}`);
  }
}
async function finish(share, interactive, skip2) {
  const repo = share.path, m = share.machine;
  if (!skip2.includes("apply")) await group("~/.claude applied", () => runApply(share), { done: "already up to date" });
  if (!skip2.includes("link")) await group("project files linked", () => steps(placeAll(share)), { done: "already in sync" });
  let secretsOk = true;
  if (!skip2.includes("secrets") && m.secretsBackend !== "none") {
    const sc = await Promise.resolve().then(() => (init_secretscmd(), secretscmd_exports));
    await group("secrets", () => sc.init(share, interactive));
    secretsOk = await sc.ensureRecipient(share, interactive);
  }
  if (!skip2.includes("hooks")) await group("automatic sync", async () => {
    await (await Promise.resolve().then(() => (init_hooks(), hooks_exports))).runHooks(share, "install");
    runApply(share);
  });
  await group("share", () => push3(repo), { done: "nothing to push" });
  let rc = 0;
  if (!skip2.includes("doctor")) rc = await group("doctor", () => runDoctor(share, false, true), { done: "all checks passed" });
  const ws = workspace2(share);
  const missing = selectedProjects2(share).filter((p) => {
    const c2 = locate(p, ws);
    return p.url && !present(c2) && c2.why === "missing";
  });
  if (missing.length && interactive && await confirm2(`clone ${missing.length} project(s) now (${missing.slice(0, 6).map((p) => p.name).join(", ")}${missing.length > 6 ? "\u2026" : ""})?`, true)) await group(`clone ${missing.length} project(s)`, async () => (await Promise.resolve().then(() => (init_projects(), projects_exports))).clone(share, []));
  const rcFile = shellRc().split("/").pop();
  note2([
    `${bold("open a new terminal")} ${dim(`(or: source ~/${rcFile})`)} \u2014 that gives you ${bold("cs")} on PATH and the ${bold("claude")} wrapper`,
    `${bold("claude")}  ${dim("log in once on this machine")}`,
    `${bold("cs")}  ${dim("what is waiting or stale")}`,
    `${bold("cs sync")}  ${dim("when leaving and when arriving")}`,
    `${bold("cs new <project> --<identity>")}  ${dim("start something")}`,
    ...secretsOk ? [] : ["", yellow(`secrets: not enabled yet \u2014 on a trusted machine run  cs sync && cs trust ${m.name} && cs sync,  then  cs sync  here`)]
  ], "next");
  outro2(bold("done"));
  return rc;
}
async function init2(o) {
  const skip2 = (o.skip ?? []).map((x) => x === "repo" ? "share" : x);
  for (const x of skip2) if (!PHASES.includes(x)) throw new Error(`cs: unknown phase '${x}' (phases: ${PHASES.join(", ")})`);
  const interactive = o.interactive ?? (isTTY() || isScripted());
  const target = shareDirDefault();
  const localSrc = o.repo && !/:\/\/|^git@/.test(o.repo) ? expand(o.repo) : void 0;
  intro2("claude-share setup");
  if (!skip2.includes("deps")) await group("prerequisites", () => runDeps(o.installDeps, true));
  const nm = await machineName(o.name ?? "", interactive);
  const already = existsSync24(target) && isRepo(target);
  if (already) {
    skip(`share already at ${contract(target)}`);
    if (remoteUrl(target)) configureRepo(target);
  } else if (!skip2.includes("share")) {
    if (localSrc) {
      if (!(isRepo(localSrc) || isBare(localSrc))) throw new Error(`cs: ${localSrc} is not a git repo`);
      mkdirSync20(dirname10(target), { recursive: true });
      git(["clone", "-q", localSrc, target]);
      ok(`share cloned from ${contract(localSrc)}`);
    } else if (o.repo) {
      const [sshUrl, gh] = parseRepoUrl(o.repo);
      if (o.key) {
        mkdirSync20(dirname10(target), { recursive: true });
        git(["clone", "-q", sshUrl, target], void 0, { sshKey: expand(o.key) });
        git(["config", "core.sshCommand", `ssh -i ${contract(expand(o.key))} -o IdentitiesOnly=yes`], target);
      } else {
        await accessLoop(sshUrl, gh, interactive, nm);
        await cloneConfig(sshUrl, target);
      }
    } else if (o.owner) {
      const token2 = await ensureToken(o.owner, interactive);
      const url = `git@github.com:${o.owner}/${SHARE_REPO_NAME}.git`;
      if (await ensureRepo(o.owner, SHARE_REPO_NAME, token2, true, "claude-share config (private)")) {
        ok(`created private repo ${o.owner}/${SHARE_REPO_NAME}`);
        newShare(target);
        git(["remote", "add", "origin", url], target);
        await accessLoop(url, [o.owner, SHARE_REPO_NAME], interactive, nm);
        configureRepo(target);
      } else {
        await accessLoop(url, [o.owner, SHARE_REPO_NAME], interactive, nm);
        await cloneConfig(url, target);
      }
    } else if (interactive) {
      const choice = await select2("What would you like to do?", [{ value: "join", label: "Join an existing share", hint: "you already have a share (from another machine)" }, { value: "create", label: "Create a new share", hint: "first machine, no share yet" }]);
      if (choice === "create") await create2(target, true, nm);
      else await join_(target, true, nm);
    } else throw new Error("cs: pass --repo <url|path> or --owner <github-owner>, or run cs init in a terminal");
  }
  const m = await machinePhase(target, nm, o.profiles ?? [], o.workspace, interactive);
  const share = open(m, target);
  await firstIdentity(share, interactive);
  await keysAndTokens(share, interactive, skip2);
  return finish(share, interactive, skip2);
}
var SHARE_REPO_NAME, PHASES, owner, email, name;
var init_init = __esm({
  "src/init.ts"() {
    "use strict";
    init_git();
    init_github();
    init_sharekey();
    init_paths();
    init_platform();
    init_machine();
    init_manifest();
    init_share();
    init_checkout();
    init_apply();
    init_projectstate();
    init_doctor();
    init_deps();
    init_identity();
    init_ui();
    SHARE_REPO_NAME = "claude-share-config";
    PHASES = ["deps", "share", "ssh", "apply", "link", "secrets", "hooks", "doctor"];
    owner = (v) => /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(v) ? void 0 : "a GitHub login, e.g. octocat";
    email = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? void 0 : "not an email address";
    name = (v) => NAME_RE.test(v) ? void 0 : "letters, digits, . _ - only";
  }
});

// src/handoff.ts
var handoff_exports = {};
__export(handoff_exports, {
  handoff: () => handoff,
  handoffDrop: () => handoffDrop,
  handoffGc: () => handoffGc,
  printNote: () => printNote,
  projectsFor: () => projectsFor,
  resume: () => resume,
  waitingList: () => waitingList
});
import { existsSync as existsSync25, readFileSync as readFileSync23, rmSync as rmSync11 } from "node:fs";
async function observe2(p, ws, o) {
  if (!enabled(p)) {
    skip(`${p.name}: handoff disabled`);
    return void 0;
  }
  const c2 = locate(p, ws, { allow: o.allow });
  if (!present(c2)) {
    if (c2.why !== "missing") skip(`${p.name}: ${c2.why}`);
    return void 0;
  }
  const r2 = await spin(`${p.name}: ${o.label}\u2026`, () => fetchWaiting(c2));
  return { checkout: c2, waiting: r2.list, offline: !r2.ok };
}
async function handoff(share, projects, o) {
  const ws = workspace2(share);
  const m = share.machine;
  let rc = 0;
  for (const p of projects) {
    const f = await observe2(p, ws, { allow: o.allow, label: "fetching handoffs" });
    if (!f) continue;
    const pl = plan([f], m.name);
    const secret = f.checkout.units.filter((u5) => u5.secrets?.length);
    for (const u5 of secret) {
      fail(`${p.name}${u5.rel === "." ? "" : "/" + u5.rel}: refusing to hand off files that look secret: ${u5.secrets.join(", ")}  (--allow <glob> to override)`);
      rc = 1;
    }
    for (const s of pl.skipped) if (!secret.some((u5) => s.startsWith(`${p.name} \xB7 ${u5.branch}: not sent`))) skip(s);
    for (const a2 of pl.actions) if (a2.kind === "send" && !(await send(a2.checkout, a2.unit, m, { note: o.note, allow: o.allow, dryRun: o.dryRun })).ok && !o.dryRun) rc = 1;
    for (const q of questions(pl)) {
      if (!q.sameBranch) continue;
      if (o.overwrite) {
        if (!(await send(q.checkout, q.unit, m, { note: o.note, allow: o.allow, dryRun: o.dryRun, over: q.handoff })).ok && !o.dryRun) rc = 1;
      } else {
        fail(`${p.name} \xB7 ${q.handoff.branch}: a handoff from ${q.handoff.machine} is waiting on ${q.handoff.ref} \u2014 run cs resume there first, or --overwrite`);
        rc = 1;
      }
    }
  }
  return rc;
}
async function resume(share, projects, o) {
  const ws = workspace2(share);
  const m = share.machine;
  let rc = 0;
  const one = async (c2, h2, replace) => {
    const r2 = await apply(c2, h2, m, { replace, keepRemote: o.keepRemote, dryRun: o.dryRun });
    if (!r2.ok) {
      if (!o.dryRun) rc = 1;
      return;
    }
    place(share, c2.project);
    if (r2.note) note2(r2.note.trim().split("\n"), `note from ${h2.machine}`);
  };
  for (const p of projects) {
    const f = await observe2(p, ws, { label: "looking for handoffs" });
    if (!f) continue;
    if (!f.waiting.length) {
      skip(`${p.name}: nothing to resume`);
      continue;
    }
    const pl = plan([f], m.name);
    for (const a2 of pl.actions) if (a2.kind === "apply") await one(a2.checkout, a2.handoff, false);
    for (const q of questions(pl)) {
      if (o.replace) await one(q.checkout, q.handoff, true);
      else {
        fail(`${p.name} \xB7 ${q.handoff.branch}: ${contract(q.unit.path)} has uncommitted changes \u2014 commit them, or --replace (keeps a backup ref)`);
        rc = 1;
      }
    }
  }
  return rc;
}
async function waitingList(share, projects) {
  const ws = workspace2(share);
  const all = [];
  for (const p of projects) {
    const f = await observe2(p, ws, { label: "fetching handoffs" });
    if (!f) continue;
    for (const h2 of f.waiting) all.push({ ...h2, project: p.name });
  }
  return all;
}
async function handoffGc(share, projects, olderThanDays) {
  const ws = workspace2(share);
  let n3 = 0;
  for (const p of projects) {
    const c2 = locate(p, ws);
    if (!present(c2)) continue;
    for (const h2 of (await fetchWaiting(c2)).list) {
      const age = (Date.now() - Date.parse(h2.when)) / 864e5;
      if (age < olderThanDays) continue;
      await gitA(["push", "-q", "origin", "--delete", h2.ref], c2.root, { check: false });
      step(`${p.name}: dropped ${h2.ref} (${Math.floor(age)} days old)`);
      n3++;
    }
  }
  return n3;
}
async function handoffDrop(share, p, ref) {
  const c2 = locate(p, workspace2(share));
  if (!present(c2)) throw new Error(`cs: ${p.name}: ${c2.why}`);
  const full = ref.startsWith("handoff/") ? ref : handoffRef(userSlug(c2.root), ref);
  await spin(`removing ${full}\u2026`, () => gitA(["push", "-q", "origin", "--delete", full], c2.root, { timeout: 60 }));
  ok(`dropped ${full}`);
}
function printNote(share, cwd = process.cwd()) {
  const p = projectForPath2(share, cwd);
  if (!p) return false;
  const f = noteFile(p);
  if (!existsSync25(f)) return false;
  const note3 = readFileSync23(f, "utf8");
  rmSync11(f, { force: true });
  const st = loadState(p);
  process.stdout.write(`Handoff note for ${p.name}${st?.resumed?.from ? ` (from ${st.resumed.from}, resumed ${st.resumed.at?.slice(0, 16)})` : ""}:
${note3.trimEnd()}
`);
  return true;
}
var questions, projectsFor;
var init_handoff = __esm({
  "src/handoff.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_share();
    init_checkout();
    init_projectstate();
    init_plan();
    init_ui();
    questions = (pl) => pl.questions.filter((q) => q.kind === "dirty-vs-waiting");
    projectsFor = (share, names, all) => {
      if (names.length) return names.map((n3) => {
        const p2 = share.manifest.projects[n3];
        if (!p2) throw new Error(`cs: unknown project '${n3}'`);
        return p2;
      });
      if (all) return selectedProjects2(share);
      const p = projectForPath2(share, process.cwd());
      if (!p) throw new Error("cs: not inside a registered project (pass a name or --all)");
      return [p];
    };
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
init_machine();
init_share();
init_paths();
init_update();
import { readFileSync as readFileSync24 } from "node:fs";
import { join as join28 } from "node:path";
var pkg = JSON.parse(readFileSync24(join28(toolRoot(), "package.json"), "utf8"));
var csv = (s) => s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [];
var HIDDEN = { hidden: true };
var program2 = new Command("cs").description("claude-share: your projects and Claude Code setup, identical on every machine").version(pkg.version, "-V, --version").option("-q, --quiet", "only warnings/errors").configureHelp({ sortSubcommands: false }).showSuggestionAfterError(true).enablePositionalOptions().addHelpText("after", `
daily
  cs                                       what is waiting for me, what is stale here
  cs sync                                  run when leaving and when arriving: handoffs, pushes, .env files, the share

occasionally
  cs new billing-api --personal            new project: dir, git, private GitHub repo, first push, Claude wired in
  cs add ~/dev/existing                    register a directory (creates its GitHub repo when it has none)
  cs remove old-thing                      take a project out of the share (its checkout and GitHub repo stay)
  cs secrets set global API_TOKEN=\u2026        encrypted; available to Claude's MCP servers as \${API_TOKEN}
  cs trust laptop                          let another machine read the secrets

setup
  cs init                                  set this machine up (wizard: join or create a share)
  cs doctor --fix                          check everything; fix what can be fixed`);
program2.hook("preAction", (_root, cmd) => setQuiet(Boolean(program2.opts().quiet || cmd.opts().quiet)));
var shareSyncAction = (title) => async (o) => {
  const share = open();
  const { runShareSync: runShareSync2 } = await Promise.resolve().then(() => (init_sharesync(), sharesync_exports));
  const opts = { pullOnly: o.pullOnly, pushOnly: o.pushOnly, timeout: +o.timeout, resolve: o.resolve, debounce: +o.debounce };
  if (o.quiet || program2.opts().quiet) {
    process.exitCode = await runShareSync2(share, opts);
    return;
  }
  await command(title, async () => {
    process.exitCode = await runShareSync2(share, opts);
  }, { outro: () => process.exitCode ? red("not synced \u2014 see above") : dim("in sync") });
};
var shareSyncOpts = (c2) => c2.option("--pull-only").option("--push-only").option("--timeout <s>", "", "20").option("--resolve <ours|theirs|newest>", "how a file changed on both machines is settled (default newest)").option("--debounce <s>", "skip if a sync ran less than N seconds ago", "0").option("-q, --quiet");
program2.command("sync").description("the daily verb: bring this machine up to date and leave nothing stale here").option("-m, --note <text>", "note carried by the handoffs sent (shown where the work is resumed)").addOption(new Option("--timeout <s>", "").default("20").hideHelp()).addOption(new Option("-q, --quiet").hideHelp()).addOption(new Option("--pull-only").hideHelp()).addOption(new Option("--push-only").hideHelp()).addOption(new Option("--debounce <s>").default("0").hideHelp()).action(async (o) => {
  if (o.pullOnly || o.pushOnly) return shareSyncAction("cs sync")(o);
  const share = open();
  const { runSync: runSync2 } = await Promise.resolve().then(() => (init_sync(), sync_exports));
  await command(`cs sync  ${dim(share.machine.name)}`, async () => {
    const r2 = await runSync2(share, { note: o.note, timeout: +o.timeout });
    process.exitCode = r2.rc;
    return r2.summary;
  }, { outro: (s) => s });
});
shareSyncOpts(program2.command("share-sync", HIDDEN).description("commit / pull --rebase / push the share only (what hooks and the timer run)")).action(shareSyncAction("cs share-sync"));
program2.command("new <name>").description("create a project: dir, git, private GitHub repo, first push, registered, Claude wired in").option("--identity <id>", "identity id (or --<id> / --<github-owner>, e.g. --personal)").option("--profiles <list>").option("-d, --description <text>", "", "").option("--public").action(async (name2, o) => {
  const share = open();
  const { create: create3, newProjectOptions: newProjectOptions2 } = await Promise.resolve().then(() => (init_projects(), projects_exports));
  const { ident: ident2, profiles } = newProjectOptions2(share, { identity: o.identity, profiles: csv(o.profiles) });
  process.exitCode = await create3(share, name2, ident2, { profiles, description: o.description, priv: !o.public });
});
program2.command("add [path]").description("register an existing directory as a project (default: cwd); creates its private GitHub repo when it has no remote").option("--profiles <list>").option("--identity <id>").option("--name <name>").option("--description <text>", "", "").option("--public").option("--no-commit").action(async (p, o) => {
  const share = open();
  const { add: add3 } = await Promise.resolve().then(() => (init_projects(), projects_exports));
  await command("cs add", () => add3(share, p, { profiles: csv(o.profiles), identity: o.identity, name: o.name, description: o.description, noCommit: !o.commit, priv: !o.public }));
});
program2.command("remove <names...>").description("take projects out of the share: manifest entry, project state, secrets; checkouts and remotes stay").option("-y, --yes", "skip the confirmation").option("--no-commit").action(async (names, o) => {
  const share = open();
  const { remove: remove2 } = await Promise.resolve().then(() => (init_remove(), remove_exports));
  await command(`cs remove ${names.join(" ")}`, () => remove2(share, names, { yes: o.yes, noCommit: !o.commit }), { outro: (s) => s });
});
program2.command("clone [names...]").description("clone the projects selected for this machine that are missing here").option("--dry-run").action(async (names, o) => {
  const share = open();
  const { clone: clone2 } = await Promise.resolve().then(() => (init_projects(), projects_exports));
  await command("cs clone", async () => {
    process.exitCode = await group(o.dryRun ? "would clone" : "cloned", () => clone2(share, names, o.dryRun), { done: "nothing missing" });
  });
});
var sec = program2.command("secrets").description("encrypted secrets in the share: set | get | edit").enablePositionalOptions();
var S = () => Promise.resolve().then(() => (init_secretscmd(), secretscmd_exports));
sec.command("set <name> <pairs...>").description("global | <project>  KEY=VALUE \u2026").action(async (n3, pairs) => {
  const share = open();
  await (await S()).setValues(share, n3, pairs);
});
sec.command("get <name> [key]").description("global | <project>  (masked; --show for values)").option("--show").action(async (n3, k, o) => {
  const share = open();
  process.exitCode = await (await S()).get(share, n3, k, o.show);
});
sec.command("edit <name>").description("global | <project>  in $EDITOR").action(async (n3) => {
  const share = open();
  await (await S()).edit(share, n3);
});
sec.command("unset <name> <keys...>", HIDDEN).action(async (n3, keys) => {
  const share = open();
  await (await S()).unsetValues(share, n3, keys);
});
sec.command("init", HIDDEN).action(async () => {
  const share = open();
  await command("cs secrets init", async () => group("secrets", async () => (await S()).init(share, isTTY())));
});
sec.command("status", HIDDEN).action(async () => {
  const share = open();
  intro2("cs secrets status");
  await (await S()).status(share);
  outro2(dim("cs secrets set \xB7 cs trust <machine>"));
});
sec.command("pull <project>", HIDDEN).option("--force").action(async (p, o) => {
  const share = open();
  process.exitCode = await (await S()).pull(share, p, o.force);
});
sec.command("push <project>", HIDDEN).action(async (p) => {
  const share = open();
  process.exitCode = await (await S()).push(share, p);
});
sec.command("diff <project>", HIDDEN).action(async (p) => {
  const share = open();
  process.exitCode = await (await S()).diff(share, p);
});
sec.command("exec [command...]", HIDDEN).description("run a command with global + project secrets in its environment").option("-p, --project <name>").passThroughOptions().allowUnknownOption().action(async (command2, o) => {
  const share = open();
  const cmd = command2[0] === "--" ? command2.slice(1) : command2;
  process.exitCode = await (await S()).exec(share, o.project, cmd);
});
sec.command("recovery", HIDDEN).action(async () => {
  const share = open();
  await command("cs secrets recovery", async () => (await S()).recovery(share));
});
var ident = program2.command("identity").description("git identities: who commits, with which key, under which GitHub owner");
ident.command("ls", { isDefault: true }).description("list identities").action(async () => {
  const share = open();
  (await Promise.resolve().then(() => (init_identity(), identity_exports))).ls(share.manifest);
});
ident.command("add <id>").requiredOption("--owner <owner>", "GitHub user or org").requiredOption("--name <name>").requiredOption("--email <email>").option("--key <path>").option("--no-token").action(async (id, o) => {
  const share = open();
  process.exitCode = await (await Promise.resolve().then(() => (init_identity(), identity_exports))).add(share, id, { owner: o.owner, name: o.name, email: o.email, key: o.key, noToken: !o.token });
});
ident.command("rename <old> <new>").action(async (a2, b) => {
  const share = open();
  process.exitCode = (await Promise.resolve().then(() => (init_identity(), identity_exports))).rename(share, a2, b);
});
program2.command("trust <machine>").description("trust another machine: let it read the secrets").action(async (mc) => {
  const share = open();
  await command(`cs trust ${mc}`, async () => group("trusted", async () => (await S()).trust(share, mc)), { outro: () => dim(`now: cs sync here, then cs sync on ${mc}`) });
});
program2.command("untrust <machine>", HIDDEN).description("untrust a machine: remove its access to the secrets").action(async (mc) => {
  const share = open();
  await command(`cs untrust ${mc}`, async () => group("untrusted", async () => (await S()).untrust(share, mc)));
});
program2.command("doctor").description("check this machine: tools, links, identities, remotes, hooks, timer; --fix repairs what it can").option("--fix").action(async (o) => {
  const share = open();
  const { runDoctor: runDoctor2 } = await Promise.resolve().then(() => (init_doctor(), doctor_exports));
  intro2("cs doctor");
  process.exitCode = await runDoctor2(share, o.fix);
  outro2(process.exitCode ? red("problems found") : green("all good"));
});
program2.command("update").description("update the cs tool itself").action(async () => {
  const { runUpdate: runUpdate2 } = await Promise.resolve().then(() => (init_update(), update_exports));
  await command("cs update", runUpdate2, { outro: () => dim(`cs ${pkg.version}`) });
});
program2.command("init").description("set this machine up (wizard) \u2014 or --repo <url> / --owner <owner> for scripts").option("--repo <url>", "existing share: git URL or local path").option("--owner <owner>", "GitHub user/org to create claude-share-config under").option("--key <path>", "ssh key for cloning --repo (instead of the share key)").option("--non-interactive").option("--name <name>", "machine name").option("--profiles <list>", "comma list").option("--workspace <path>").option("--skip <phases>", "comma list: deps,share,ssh,apply,link,secrets,hooks,doctor").option("--install-deps").action(async (o) => {
  const { init: init3 } = await Promise.resolve().then(() => (init_init(), init_exports));
  process.exitCode = await init3({ repo: o.repo, owner: o.owner, key: o.key, name: o.name, profiles: csv(o.profiles), workspace: o.workspace, skip: csv(o.skip), installDeps: o.installDeps, interactive: !o.nonInteractive && (isTTY() || isScripted()) });
});
program2.command("status", HIDDEN).description("what bare `cs` shows").option("--no-fetch").option("--all").action(async (o) => {
  const share = open();
  const { runStatus: runStatus2 } = await Promise.resolve().then(() => (init_status(), status_exports));
  intro2(`cs status  ${dim(share.machine.name)}`);
  const r2 = await runStatus2(share, o.fetch, o.all);
  process.exitCode = r2.rc;
  outro2(r2.next ? yellow(`run: ${r2.next}`) : dim("cs sync \xB7 cs doctor"));
});
program2.command("apply", HIDDEN).description("render ~/.claude + git identity includes from the share").option("--check", "report drift, change nothing").action(async (o) => {
  const share = open();
  const { runApply: runApply2 } = await Promise.resolve().then(() => (init_apply(), apply_exports));
  await command(o.check ? "cs apply --check" : "cs apply", async () => {
    const n3 = (await group(o.check ? "drift" : "~/.claude applied", () => runApply2(share, o.check), { done: o.check ? "no drift" : "already up to date" })).length;
    process.exitCode = o.check && n3 ? 1 : 0;
  });
});
program2.command("link [names...]", HIDDEN).description("place project state (Claude files, memory) into project checkouts; newer content flows back").option("--check").action(async (names, o) => {
  const share = open();
  const { placeAll: placeAll2 } = await Promise.resolve().then(() => (init_projectstate(), projectstate_exports));
  await command(o.check ? "cs link --check" : "cs link", async () => {
    const n3 = await group(o.check ? "pending changes" : "project files linked", () => {
      const lines = placeAll2(share, { names, check: o.check });
      steps(lines);
      return lines.length;
    }, { done: "nothing pending" });
    process.exitCode = o.check && n3 ? 1 : 0;
  });
});
program2.command("import <what> [names...]", HIDDEN).description("take existing local state into the share (memory | project | mcp)").option("--all").option("--check").option("--show", "(mcp) print the secret values").action(async (what, names, o) => {
  const share = open();
  const { runImport: runImport2 } = await Promise.resolve().then(() => (init_import(), import_exports));
  const { selectedProjects: selectedProjects3 } = await Promise.resolve().then(() => (init_share(), share_exports));
  const targets = names.length ? names : o.all ? selectedProjects3(share).map((p) => p.name) : [];
  if (o.show) {
    runImport2(share, what, targets, o.check, true);
    return;
  }
  await command(`cs import ${what}`, async () => {
    for (const n3 of targets) await group(n3, () => runImport2(share, what, [n3], o.check, false), { done: "nothing to import" });
  });
});
program2.command("hooks [action]", HIDDEN).description("automatic share sync: install | remove | status").option("--no-timer").action(async (action = "status", o) => {
  const share = open();
  const { runHooks: runHooks2 } = await Promise.resolve().then(() => (init_hooks(), hooks_exports));
  if (action === "status") {
    intro2("cs hooks");
    process.exitCode = await runHooks2(share, action, o.timer);
    outro2(dim("cs hooks install \xB7 cs hooks remove"));
    return;
  }
  await command(`cs hooks ${action}`, async () => {
    process.exitCode = await group(action === "remove" ? "removed" : "installed", () => runHooks2(share, action, o.timer));
  });
});
var token = program2.command("token", HIDDEN).description("GitHub API tokens per owner (local, never synced)");
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
    const who = await spin(`checking token for ${o}\u2026`, async () => gh.whoami(t2));
    ok(`token for '${o}' authenticates as ${who}`);
  } catch (e) {
    fail(e.message);
    process.exitCode = 1;
  }
});
token.command("rm <owner>").action(async (o) => {
  (await Promise.resolve().then(() => (init_github(), github_exports))).rmToken(o);
  ok("removed");
});
token.command("ls").action(async () => {
  for (const o of (await Promise.resolve().then(() => (init_github(), github_exports))).listTokens()) console.log(o);
});
program2.command("ssh [action]", HIDDEN).description("per-machine SSH keys: setup | check | share-key").action(async (action = "check") => {
  const share = open();
  await command(
    `cs ssh ${action}`,
    async () => {
      if (action === "share-key") process.exitCode = await (await Promise.resolve().then(() => (init_sharekey(), sharekey_exports))).setup(share.path, isTTY());
      else process.exitCode = await (await Promise.resolve().then(() => (init_ssh(), ssh_exports))).setup(share, action === "check");
    },
    { outro: () => process.exitCode ? yellow("keys still to register \u2014 re-run cs ssh check afterwards") : green("all keys verified") }
  );
});
program2.command("deps", HIDDEN).description("check (or install) prerequisites").option("--install").action(async (o) => {
  await command(o.install ? "cs deps --install" : "cs deps", async () => {
    process.exitCode = await (await Promise.resolve().then(() => (init_deps(), deps_exports))).runDeps(o.install);
  }, { outro: () => process.exitCode ? red("required tools missing") : green("all required tools present") });
});
var shareCmd = program2.command("share", HIDDEN).description("the share itself: new <path> | path");
shareCmd.command("new <path>").description("create a share skeleton").action(async (p) => {
  const { newShare: newShare2 } = await Promise.resolve().then(() => (init_init(), init_exports));
  const { expand: expand2, contract: contract3 } = await Promise.resolve().then(() => (init_paths(), paths_exports));
  const d = newShare2(expand2(p));
  ok(`share created at ${contract3(d)} \u2014 edit projects.toml, then cs init --repo ${contract3(d)}`);
});
shareCmd.command("path").description("print the share path").action(() => console.log(shareDir(loadMachine())));
var proj = program2.command("project", HIDDEN).description("project helpers: id");
proj.command("id").description("print the project name for the cwd").action(() => {
  const share = open();
  const p = projectForPath2(share, process.cwd());
  if (p) console.log(p.name);
  else process.exitCode = 1;
});
var H = () => Promise.resolve().then(() => (init_handoff(), handoff_exports));
program2.command("handoff [projects...]", HIDDEN).description("send a handoff: uncommitted work of the cwd project (or --all) to its remote").option("-m, --note <text>", "note shown when the work is resumed").option("--all", "every selected project").option("--dry-run").option("--allow <glob>", "override the secret-file deny list", (v, a2) => [...a2, v], []).option("--overwrite", "replace a handoff another machine left").addOption(new Option("--mark").hideHelp()).option("-q, --quiet").action(async (names, o) => {
  if (o.mark) return;
  const share = open();
  const h2 = await H();
  await command(
    "cs handoff",
    async () => {
      const projects = h2.projectsFor(share, names, o.all);
      process.exitCode = await group("handed off", () => h2.handoff(share, projects, { note: o.note, dryRun: o.dryRun, allow: o.allow, overwrite: o.overwrite }), { done: "nothing to hand off" });
      if (!o.dryRun) {
        const { runShareSync: runShareSync2 } = await Promise.resolve().then(() => (init_sharesync(), sharesync_exports));
        await group("share pushed", () => runShareSync2(share, { pushOnly: true, timeout: 20 }), { done: "already in sync" });
      }
    },
    { outro: () => process.exitCode ? red("some units not handed off \u2014 see above") : dim("on the other machine: cs sync") }
  );
});
program2.command("resume [projects...]", HIDDEN).description("apply waiting handoffs as uncommitted changes and delete them from the remote").option("--all").option("--replace", "discard local uncommitted changes in the target (a backup ref is kept)").option("--keep-remote", "leave the handoff on the remote").option("--dry-run").action(async (names, o) => {
  const share = open();
  const h2 = await H();
  await command(
    "cs resume",
    async () => {
      const projects = h2.projectsFor(share, names, o.all);
      const { runShareSync: runShareSync2 } = await Promise.resolve().then(() => (init_sharesync(), sharesync_exports));
      await group("share pulled", () => runShareSync2(share, { pullOnly: true, timeout: 10 }), { done: "up to date" });
      process.exitCode = await group("resumed", () => h2.resume(share, projects, { replace: o.replace, keepRemote: o.keepRemote, dryRun: o.dryRun }), { done: "no handoffs waiting" });
    },
    { outro: () => process.exitCode ? red("some handoffs not applied \u2014 see above") : dim("carry on: claude") }
  );
});
var handoffs2 = program2.command("handoffs", HIDDEN).description("handoffs waiting on remotes: ls | gc | drop");
handoffs2.command("ls", { isDefault: true }).option("--all").action(async (o) => {
  const share = open();
  const h2 = await H();
  const projects = h2.projectsFor(share, [], o.all ?? true);
  intro2("cs handoffs");
  const list = await h2.waitingList(share, projects);
  if (!list.length) info(dim("no handoffs waiting"));
  else table(list.map((x) => [x.project, x.branch, x.machine, x.when.slice(0, 16), dim(x.note)]), ["project", "branch", "from", "when", "note"]);
  outro2(dim("cs sync \xB7 cs handoffs gc --older-than 14"));
});
handoffs2.command("gc").option("--older-than <days>", "", "14").option("--all").action(async (o) => {
  const share = open();
  const h2 = await H();
  await command("cs handoffs gc", async () => group("dropped", () => h2.handoffGc(share, h2.projectsFor(share, [], true), +o.olderThan), { done: "nothing older than that" }));
});
handoffs2.command("drop <branch>").description("delete one waiting handoff (branch name or full ref) for the cwd project").action(async (b) => {
  const share = open();
  const h2 = await H();
  const [p] = h2.projectsFor(share, [], false);
  await command("cs handoffs drop", () => h2.handoffDrop(share, p, b));
});
program2.command("note", HIDDEN).description("print (once) the note of the last handoff applied for the cwd project").option("--print").action(async () => {
  const share = open();
  const h2 = await H();
  if (!h2.printNote(share)) process.exitCode = 1;
});
program2.command("ui-demo", HIDDEN).description("show every UI element with fake data").action(async () => {
  const sleep = (ms) => new Promise((r2) => setTimeout(r2, ms));
  await command("cs ui-demo", async () => {
    await spin("a 2-second spinner (must animate)\u2026", () => sleep(2e3));
    await group("grouped phase with items", async () => {
      for (const n3 of ["alpha", "beta", "gamma"]) {
        await spin(`working on ${n3}\u2026`, () => sleep(600));
        step(`${n3} done`);
      }
    });
    await group("empty phase", () => {
    }, { done: "nothing to do" });
    table([[green("\u2713"), "node", dim("v22")], [yellow("!"), "gh", dim("missing")]]);
    note2([`title  ${bold("cs:demo:share-key")}`, `key    ${bold("ssh-ed25519 AAAA\u2026 cs:demo:share-key")}`], "a note box");
    warn("a warning");
    fail("an error line (does not abort)");
    if (isTTY()) {
      const v = await select2("a select", [{ value: "a", label: "Option A", hint: "hint" }, { value: "b", label: "Option B" }]);
      const ok2 = await confirm2(`you picked ${v} \u2014 confirm?`, true);
      step(`confirm \u2192 ${ok2}`);
    }
  }, { outro: () => dim("demo over") });
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
      const share = open();
      const { rewriteIdentityFlags: rewriteIdentityFlags2 } = await Promise.resolve().then(() => (init_projects(), projects_exports));
      process.argv = [...process.argv.slice(0, 2), ...rewriteIdentityFlags2(argv, share.manifest)];
    } catch {
    }
  }
  if (argv.every((a2) => a2 === "--no-fetch")) {
    if (!machineExists()) program2.help();
    const share = open();
    await (await Promise.resolve().then(() => (init_status(), status_exports))).runBare(share, !argv.length);
    return;
  }
  const cmdName = argv.find((a2) => !a2.startsWith("-"));
  const wantsCheck = !["update", "ui-demo"].includes(cmdName ?? "") && !argv.includes("-q") && !argv.includes("--quiet");
  const finishCheck = wantsCheck ? await startUpdateCheck() : async () => 0;
  try {
    await program2.parseAsync(process.argv);
  } catch (e) {
    if (e?.handled) {
      process.exitCode = e.code ?? 1;
      return;
    }
    const msg = e?.message ?? String(e);
    if (msg.startsWith("cs: ")) {
      const [what, ...rest] = msg.slice(4).split("\n");
      error(what, rest.join("\n").trim());
      process.exitCode = 1;
    } else throw e;
  } finally {
    const hint = behindHint(await behindCount(finishCheck));
    if (hint) console.error(yellow("!") + " " + hint);
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
