/**
 * Parameters Panel Component
 * Left panel with collapsible accordions for all parameter groups
 */

'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CurriculumParameters } from './CurriculumParameters';
import { RentParameters } from './RentParameters';
import { StaffingParameters } from './StaffingParameters';
import { OpexParameters } from './OpexParameters';
import { CapexParameters } from './CapexParameters';
import { AdminSettings } from './AdminSettings';
import { useSimulationStore } from '@/stores/simulation-store';

interface ParametersPanelProps {
  userRole: string;
}

export function ParametersPanel({ userRole }: ParametersPanelProps) {
  const { changes } = useSimulationStore();

  return (
    <div className="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <Accordion
        type="multiple"
        defaultValue={['curriculum', 'rent']}
        onValueChange={() => {}}
      >
        {/* Curriculum Parameters */}
        <AccordionItem value="curriculum">
          <AccordionTrigger value="curriculum">Curriculum Parameters</AccordionTrigger>
          <AccordionContent value="curriculum">
            <CurriculumParameters
              hasChanges={!!(changes.curriculum?.fr || changes.curriculum?.ib)}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Rent Parameters */}
        <AccordionItem value="rent">
          <AccordionTrigger value="rent">Rent Parameters</AccordionTrigger>
          <AccordionContent value="rent">
            <RentParameters hasChanges={!!changes.rent} />
          </AccordionContent>
        </AccordionItem>

        {/* Staffing Parameters */}
        <AccordionItem value="staffing">
          <AccordionTrigger value="staffing">Staffing Parameters</AccordionTrigger>
          <AccordionContent value="staffing">
            <StaffingParameters hasChanges={!!changes.staffing} />
          </AccordionContent>
        </AccordionItem>

        {/* Opex Parameters */}
        <AccordionItem value="opex">
          <AccordionTrigger value="opex">Opex Parameters</AccordionTrigger>
          <AccordionContent value="opex">
            <OpexParameters hasChanges={!!changes.opex} />
          </AccordionContent>
        </AccordionItem>

        {/* Capex Parameters */}
        <AccordionItem value="capex">
          <AccordionTrigger value="capex">Capex Parameters</AccordionTrigger>
          <AccordionContent value="capex">
            <CapexParameters hasChanges={!!changes.capex} />
          </AccordionContent>
        </AccordionItem>

        {/* Admin Settings (ADMIN only) */}
        <AccordionItem value="admin">
          <AccordionTrigger value="admin">Admin Settings</AccordionTrigger>
          <AccordionContent value="admin">
            <AdminSettings hasChanges={!!changes.admin} userRole={userRole} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

