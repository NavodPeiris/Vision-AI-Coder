import Stack from '@mui/material/Stack';
import SendIcon from '@mui/icons-material/Send';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import { IconButton } from '@mui/material';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export default function ButtonStack() {

  return (
    <Stack direction="row" spacing={1}>
      <IconButton id="askButton" color="secondary">
        <SendIcon/>
      </IconButton>
    </Stack>
  );
}
