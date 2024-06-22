import * as React from 'react';
import { TextareaAutosize as BaseTextareaAutosize } from '@mui/base/TextareaAutosize';
import { styled } from '@mui/system';
import { UICOLOR, TEXTCOLOR } from './uiConstants';

export default function AITextArea() {

  const Textarea = styled(BaseTextareaAutosize)(
    ({ theme }) => `
    box-sizing: border-box;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.5;
    padding: 12px;
    border-radius: 12px 12px 0 12px;
    color: ${TEXTCOLOR};
    background: transparent;
    border: 1px solid ${UICOLOR};
    box-shadow: 0px 2px 2px ${UICOLOR};

    &:hover {
      border-color: ${UICOLOR};
    }

    &:focus {
      outline: 0;
      border-color: ${UICOLOR};
    }

    // firefox
    &:focus-visible {
      outline: 0;
    }
  `,
  );

  return (
    <>
      <Textarea id="question" minRows={3} placeholder="ask me anything" />
      <Textarea id="image" placeholder="image path (optional)"/>
    </>
  );
}
