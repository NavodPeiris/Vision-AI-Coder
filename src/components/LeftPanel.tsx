/* eslint-disable @typescript-eslint/naming-convention */
import { EXTENSION_CONSTANT } from 'constant';
import InputBar from './InputBar';
import ButtonStack from './buttonStack';
import Button from '@mui/material/Button';

function LeftPanel(){

    return (
        <div className='panel-wrapper'>
            <span className='panel-info'>Vision AI Coder</span>
            <Button color="secondary" variant="outlined" size="small" id={EXTENSION_CONSTANT.ELEMENT_IDS.DOWNLOAD_MODEL_BUTTON}>
                Download Model
            </Button>
            <Button color="secondary" variant="outlined" size="small" id={EXTENSION_CONSTANT.ELEMENT_IDS.START_SERVER_BUTTON}>
                Start Server
            </Button>
            <div id="chat"></div>
            <InputBar/>
            <ButtonStack/>
        </div>
    );
}

export default LeftPanel;