'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { Card, CardContent } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PwaBannerEditorProps {
  config: any
  onChange: (config: any) => void
}

export function PwaBannerEditor({ config = {}, onChange }: PwaBannerEditorProps) {
  const handleChange = (key: string, value: any) => {
    onChange({ ...config, [key]: value })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
             <Label>Banner Position</Label>
             <Select 
                value={config.bannerPosition || 'bottom'} 
                onValueChange={(val) => handleChange('bannerPosition', val)}
             >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                   <SelectItem value="bottom">Bottom (Fixed)</SelectItem>
                   <SelectItem value="top">Top (Fixed)</SelectItem>
                </SelectContent>
             </Select>
          </div>
      </div>

      <div className="grid gap-2">
         <Label>Banner Title (Header)</Label>
         <Input 
            value={config.titleText || ''} 
            onChange={(e) => handleChange('titleText', e.target.value)} 
            placeholder="Install our App"
         />
      </div>
      <div className="grid gap-2">
         <Label>Description Text</Label>
         <Input 
            value={config.descriptionText || ''} 
            onChange={(e) => handleChange('descriptionText', e.target.value)} 
            placeholder="Add to home screen for quick access"
         />
      </div>

       <Accordion type="multiple" defaultValue={['container', 'button']}>
         
         {/* Container Styling */}
         <AccordionItem value="container">
           <AccordionTrigger>Container Styles</AccordionTrigger>
           <AccordionContent className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label>Background Color</Label>
                    <ColorInput value={config.bannerBgColor || '#ffffff'} onChange={(c) => handleChange('bannerBgColor', c)} />
                 </div>
                 <div className="grid gap-2">
                    <Label>Text Color</Label>
                    <ColorInput value={config.bannerTextColor || '#000000'} onChange={(c) => handleChange('bannerTextColor', c)} />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label>Padding</Label>
                    <Input value={config.bannerPadding || '12px'} onChange={(e) => handleChange('bannerPadding', e.target.value)} placeholder="12px" />
                 </div>
                 <div className="grid gap-2">
                    <Label>Margin</Label>
                    <Input value={config.bannerMargin || '0px'} onChange={(e) => handleChange('bannerMargin', e.target.value)} placeholder="16px" />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label>Border Radius</Label>
                    <Input value={config.bannerBorderRadius || '0px'} onChange={(e) => handleChange('bannerBorderRadius', e.target.value)} placeholder="8px" />
                 </div>
                 <div className="grid gap-2">
                    <Label>Border Width</Label>
                    <Input value={config.bannerBorderWidth || '0px'} onChange={(e) => handleChange('bannerBorderWidth', e.target.value)} placeholder="1px" />
                 </div>
              </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                      <Label>Border Color</Label>
                      <ColorInput value={config.bannerBorderColor || 'transparent'} onChange={(c) => handleChange('bannerBorderColor', c)} />
                  </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                  <Label>Shadow</Label>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                          <Label className="text-xs">Color</Label>
                          <ColorInput value={config.bannerShadowColor || 'rgba(0,0,0,0.1)'} onChange={(c) => handleChange('bannerShadowColor', c)} />
                      </div>
                      <div className="grid gap-2">
                           <Label className="text-xs">String (CSS)</Label>
                           <Input 
                              value={config.bannerShadow || ''} 
                              onChange={(e) => handleChange('bannerShadow', e.target.value)} 
                              placeholder="0 4px 6px -1px rgba(0, 0, 0, 0.1)" 
                           />
                           <p className="text-[10px] text-muted-foreground">Overrides individual shadow props if set.</p>
                      </div>
                  </div>
              </div>
           </AccordionContent>
         </AccordionItem>

         {/* Install Button Styling */}
         <AccordionItem value="button">
           <AccordionTrigger>Install Button Styles</AccordionTrigger>
           <AccordionContent className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label>Background Color</Label>
                    <ColorInput value={config.buttonBgColor || '#000000'} onChange={(c) => handleChange('buttonBgColor', c)} />
                 </div>
                 <div className="grid gap-2">
                    <Label>Text Color</Label>
                    <ColorInput value={config.buttonTextColor || '#ffffff'} onChange={(c) => handleChange('buttonTextColor', c)} />
                 </div>
              </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label>Hover Bg Color</Label>
                    <ColorInput value={config.buttonHoverBgColor || ''} onChange={(c) => handleChange('buttonHoverBgColor', c)} placeholder="Optional" />
                 </div>
                 <div className="grid gap-2">
                    <Label>Hover Text Color</Label>
                     <ColorInput value={config.buttonHoverTextColor || ''} onChange={(c) => handleChange('buttonHoverTextColor', c)} placeholder="Optional" />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label>Border Radius (Raduian)</Label>
                    <Input value={config.buttonBorderRadius || '4px'} onChange={(e) => handleChange('buttonBorderRadius', e.target.value)} />
                 </div>
                 <div className="grid gap-2">
                    <Label>Border Weight</Label>
                    <Input value={config.buttonBorderWidth || '0px'} onChange={(e) => handleChange('buttonBorderWidth', e.target.value)} />
                 </div>
              </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                      <Label>Border Color</Label>
                      <ColorInput value={config.buttonBorderColor || 'transparent'} onChange={(c) => handleChange('buttonBorderColor', c)} />
                  </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                   <Label>Shadow</Label>
                    <div className="grid gap-2">
                         <Input 
                            value={config.buttonShadow || ''} 
                            onChange={(e) => handleChange('buttonShadow', e.target.value)} 
                            placeholder="0 2px 4px rgba(0,0,0,0.1)" 
                         />
                    </div>
              </div>
           </AccordionContent>
         </AccordionItem>

       </Accordion>
    </div>
  )
}
