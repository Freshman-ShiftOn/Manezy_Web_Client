import React from "react";
import { Box, Button } from "@mui/material";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

interface Props {
  data: {
    openHour: string;
    closeHour: string;
  };
  onUpdate: (d: Partial<any>) => void;
  onFinish: () => void;
  onBack: () => void;
}

function WizardStepInitialSchedule({
  data,
  onUpdate,
  onFinish,
  onBack,
}: Props) {
  return (
    <Box>
      <h2>초기 스케줄 설정 (Step 3)</h2>
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        selectable
        editable
        slotMinTime={data.openHour}
        slotMaxTime={data.closeHour}
      />
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
        <Button onClick={onBack}>이전</Button>
        <Button variant="contained" onClick={onFinish}>
          완료
        </Button>
      </Box>
    </Box>
  );
}

export default WizardStepInitialSchedule;
