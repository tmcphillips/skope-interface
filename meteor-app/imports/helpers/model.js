import _ from 'lodash';
import moment from 'moment';

export
const getNumber = (value, defaultValue) => {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }

  return defaultValue;
};

/**
 * Make sure the filter value is correct.
 */
export
const clampFilterValue = (value, min, max) => {
  let newValue = parseInt(value, 10);
  newValue = isNaN(newValue) ? min : newValue;
  newValue = Math.max(min, newValue);
  newValue = Math.min(newValue, max);
  return newValue;
};

/**
 * This function resets all the temporal unit fields outside of the precision
 * to their corresponding zero points.
 * This function returns a new Date object and does not modify the inputs.
 * @param {Date} date
 * @param {number} precision - 0: year, 1: month, 2: day,
 *                             3: hour, 4: minute, 5: second, 6: millisecond
 * @return {Date}
 */
export
const getDateAtPrecision = (
  (precisions) =>
    (
      date,
      precision,
    ) =>
      precisions.reduce((acc, { handler, zeroPoint }, index) => {
        // Only need to run precision handlers larger than precision.
        if (index <= precision) {
          return acc;
        }

        const newDate = new Date(acc);

        handler.call(newDate, zeroPoint);

        return newDate;
      }, date)
)([
  {
    handler: Date.prototype.setUTCFullYear,
    zeroPoint: 0,
  },
  {
    handler: Date.prototype.setUTCMonth,
    zeroPoint: 0,
  },
  {
    handler: Date.prototype.setUTCDate,
    zeroPoint: 1,
  },
  {
    handler: Date.prototype.setUTCHours,
    zeroPoint: 0,
  },
  {
    handler: Date.prototype.setUTCMinutes,
    zeroPoint: 0,
  },
  {
    handler: Date.prototype.setUTCSeconds,
    zeroPoint: 0,
  },
  {
    handler: Date.prototype.setUTCMilliseconds,
    zeroPoint: 0,
  },
]);

/**
 * @param {Date} date
 * @param {number} precision - 0: year, 1: month, 2: day,
 *                             3: hour, 4: minute, 5: second, 6: millisecond
 * @param {number} offset
 * @return {Date}
 */
export
const offsetDateAtPrecision = (
  (precisions) =>
    (
      date,
      precision,
      offset,
    ) => {
      const {
        setter,
        getter,
      } = precisions[precision];

      const newDate = new Date(date);

      let value = getter.call(newDate);

      value += offset;

      setter.call(newDate, value);

      return newDate;
    }
)([
  {
    setter: Date.prototype.setUTCFullYear,
    getter: Date.prototype.getUTCFullYear,
  },
  {
    setter: Date.prototype.setUTCMonth,
    getter: Date.prototype.getUTCMonth,
  },
  {
    setter: Date.prototype.setUTCDate,
    getter: Date.prototype.getUTCDate,
  },
  {
    setter: Date.prototype.setUTCHours,
    getter: Date.prototype.getUTCHours,
  },
  {
    setter: Date.prototype.setUTCMinutes,
    getter: Date.prototype.getUTCMinutes,
  },
  {
    setter: Date.prototype.setUTCSeconds,
    getter: Date.prototype.getUTCSeconds,
  },
  {
    setter: Date.prototype.setUTCMilliseconds,
    getter: Date.prototype.getUTCMilliseconds,
  },
]);

export
const ResolutionToPrecisionMapping = {
  year: 0,
  month: 1,
  date: 2,
  day: 2, // alias to "date".
  hour: 3,
  minute: 4,
  second: 5,
  millisecond: 5,
};

export
const AllResolutionNames = Object.keys(ResolutionToPrecisionMapping);

/**
 * @param {string} resolution
 * @returns {number}
 */
export
const getPrecisionByResolution = (
  (resolutionToPrecision) => (
    resolution,
  ) => resolutionToPrecision[resolution]
)(ResolutionToPrecisionMapping);

/**
 * @param {Date} date
 * @param {number} precision
 * @returns {string}
 */
export
const getDateStringAtPrecision = (date, precision, options = {}) => {
  const {
    delimiter = '-',
  } = options;

  const year = date.getUTCFullYear();
  const yearString = year < 0
    // For negative years, should pad to 6 digits, to conform to `toISOString`.
    ? `-${String(-year).padStart(6, '0')}`
    : `${year}`.padStart(4, '0');

  const dateStringSegments = [
    yearString,
    `${date.getUTCMonth() + 1}`.padStart(2, '0'),
    `${date.getUTCDate()}`.padStart(2, '0'),
  ];

  const necessarySegments = dateStringSegments.slice(0, precision + 1);
  const dateString = necessarySegments.join(delimiter);

  return dateString;
};

/**
 * Parse the given string to a date at a specific precision.
 * This assumes the input conforms to the format `year-month-day`.
 * No segments are required to be padded to full length.
 *
 * Extra information contained in the date string will be discarded.
 * For example, parsing "2345-6-7" at monthly resolution will yield "2345-6".
 *
 * On the other hand, missing information will be filled with default values,
 * whenever possible.
 * For example, parsing "2345-6" at daily resolution will yield "2345-6-1".
 * However, year can not be omitted, since there is no suitable default value.
 *
 * @param {string} dateString
 * @param {number} precision
 * @returns {Date}
 */
export
const parseDateStringWithPrecision = (dateString, precision, options = {}) => {
  const {
    delimiter = '-',
  } = options;

  const isBcYear = dateString[0] === '-';
  const absYearStr = isBcYear ? dateString.substr(1) : dateString;
  const dateStringSegments = absYearStr.split(delimiter);
  const dateValueSegments = dateStringSegments.map((s) => parseInt(s, 10));

  const absYear = getNumber(dateValueSegments[0]);
  if (typeof absYear === 'undefined') {
    throw new Error(`"${dateString}" is not a valid date string: year info missing.`);
  }

  // Create a date object with all fields cleared out.
  const date = getDateAtPrecision(new Date(), -1);
  const year = isBcYear ? -absYear : absYear;
  const month = getNumber(dateValueSegments[1], 1);
  const day = getNumber(dateValueSegments[2], 1);

  date.setUTCFullYear(year);
  date.setUTCMonth(month - 1);
  date.setUTCDate(day);

  const dateAtPrecision = getDateAtPrecision(date, precision);

  return dateAtPrecision;
};

/**
 * @param {number} precision
 * @param {Date} start
 * @param {Date} end
 * @returns {string}
 */
export
const getDateRangeStringAtPrecision = (
  precision,
  start,
  end,
) => {
  if (!start && !end) {
    return '';
  }

  return [start, end]
  .map((d) => getDateStringAtPrecision(d, precision))
  .join(' - ');
};

/**
 * @param {Object} geometry
 * @returns {Object}
 */
export
const buildGeoJsonWithGeometry = (geometry) => {
  if (!geometry) {
    return null;
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry,
      },
    ],
  };
};

const placeholderGlobalFindPattern = /\{([a-z-_][a-z0-9-_]*)\}/gim;
const placeholderPattern = /\{([a-z-_][a-z0-9-_]*)\}/i;

/**
 * If filler is not found, replace matched string with empty string.
 * @param {string} templateString - The data string to be modified.
 * @param {string} matchedString - The matched placeholder string (that contains the `{}`).
 * @param {Object<string, Function|*>} fillers - A collection of available fillers. A filler could be a function that returns the value or a literal value.
 * @param {Object} dataStore - Optional secondary storage location if it's not favorable to store the value in string form.
 * @return {string} - Returns the modified data string.
 */
const fillTemplateStringSegment = (templateString, matchedString, fillers, dataStore) => {
  const match = matchedString.match(placeholderPattern);

  if (!match) {
    return templateString;
  }

  const fillerName = match[1];
  const filler = fillers[fillerName];

  if (!filler) {
    return templateString.replace(matchedString, '');
  }

  const replacementValue = typeof filler === 'function' ? filler() : filler;
  const replacementType = typeof replacementValue;
  let replacementString = '';
  let dataStoreValue = null;

  if (replacementValue === null || typeof replacementValue === 'undefined') {
    // `null` and undefined values should be empty.
    replacementString = '';
  } else if (replacementType === 'string') {
    // String type values go straight to the url.
    replacementString = encodeURIComponent(replacementValue);
  } else if (dataStore) {
    // Other types of values go to the dataStore, if possible.
    // The value in url would be empty.
    dataStoreValue = replacementValue;
    replacementString = '';
  } else {
    // If dataStore is not available, force convert value into string type and place it in url.
    replacementString = String(replacementValue);
  }

  if (dataStore && (dataStoreValue !== null)) {
    dataStore[fillerName] = replacementValue;
  }

  return templateString.replace(matchedString, replacementString);
};

/**
 * Return the same input string with placeholders filled.
 * Fillers could be functions or literal values.
 * @param {string} templateString
 * @param {Object<string, Function|*>} fillers
 * @param {Object} dataStore - Optional place to store complex data types. This value will be mutated.
 * @returns {string}
 */
export
const fillTemplateString = (templateString, fillers, dataStore) => {
  if (!templateString) {
    return templateString;
  }

  // @type {Array|null}
  const match = templateString.match(placeholderGlobalFindPattern);

  if (!match) {
    return templateString;
  }

  return match.reduce((str, matchedString) => fillTemplateStringSegment(str, matchedString, fillers, dataStore), templateString);
};

export
function difference(object, base) {
  return _.transform(object, function(result, value, key) {
    if (!_.isEqual(value, base[key])) {
      result[key] = (_.isObject(value) && _.isObject(base[key]))
                    ? difference(value, base[key])
                    : value;
    }
  });
}

/**
 * Go through objects or arrays to find strings and convert them into numbers whenever possible.
 */
export
const stringToNumber = (value, postProcess = (x) => x) => {
  let finalValue = value;

  switch (typeof value) {
    case 'string':
      if (!isNaN(value)) {
        finalValue = parseFloat(value);
      }
      break;
    case 'object':
      if (Array.isArray(value)) {
        finalValue = value.map((item) => stringToNumber(item, postProcess));
      } else if (value !== null) {
        finalValue = Object.entries(value).reduce((acc, [key, value]) => {
          return {
            ...acc,
            [key]: stringToNumber(value, postProcess),
          };
        }, {});
      }
      break;
    default:
  }

  return postProcess(finalValue);
};

/**
 * @param {Date} date
 * @param {Date} minDate
 * @param {Date} maxDate
 */
export
const clampDateWithinRange = (date, minDate, maxDate) => {
  let finalDate = date;

  if (finalDate.valueOf() > maxDate.valueOf()) {
    finalDate = maxDate;
  }

  if (finalDate.valueOf() < minDate.valueOf()) {
    finalDate = minDate;
  }

  return finalDate;
};

export
const NOOP = () => {};
