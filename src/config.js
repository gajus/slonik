// @flow

/* eslint-disable no-process-env */

import boolean from 'boolean';

export const SLONIK_LOG_NORMALISED = boolean(process.env.SLONIK_LOG_NORMALISED);
export const SLONIK_LOG_STACK_TRACE = boolean(process.env.SLONIK_LOG_STACK_TRACE);
export const SLONIK_LOG_VALUES = boolean(process.env.SLONIK_LOG_VALUES);
