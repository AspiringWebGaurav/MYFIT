// TEST_MODE_ONLY
import { useSandboxStore } from '../store/useSandboxStore';

export const APP_TEST_MODE = true;
export const IS_TEST_MODE = APP_TEST_MODE; 

export const getTestTodayString = () => {
  if (!APP_TEST_MODE) {
    const date = new Date();
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split('T')[0];
  }
  const testDate = useSandboxStore.getState().testDateStr;
  if (testDate) return testDate;
  
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

export const getTestCurrentDay = () => {
  if (!APP_TEST_MODE) return new Date().getDay();
  const dateStr = getTestTodayString();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).getDay();
};

export const getGlobalDate = () => {
  const realNow = new Date();
  if (!APP_TEST_MODE) return realNow;
  
  const testDateStr = useSandboxStore.getState().testDateStr;
  if (!testDateStr) return realNow;
  
  const [year, month, day] = testDateStr.split('-').map(Number);
  
  // Merge the sandbox date with the real current time so clocks still tick
  const mockDate = new Date(year, month - 1, day, realNow.getHours(), realNow.getMinutes(), realNow.getSeconds(), realNow.getMilliseconds());
  return mockDate;
};
