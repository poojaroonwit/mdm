'use client'

import { ChatbotConfig } from '@/app/chat/[id]/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { FormRow, FormSection } from '../components/FormRow'
import { Zap } from 'lucide-react'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'

interface AnimationSectionProps {
    config: ChatbotConfig
    handleChange: (field: keyof ChatbotConfig, value: any) => void
}

export function AnimationSection({ config, handleChange }: AnimationSectionProps) {
    return (
        <div className="py-2 w-full">
            <div className="px-4 pb-4">
                <p className="text-sm text-muted-foreground">
                    Customize the entrance and exit animations of the chat widget for a smooth user experience.
                </p>
            </div>

            <AccordionSectionWrapper defaultValue="animations">
                <AccordionSectionGroup id="animations" title="Animations" icon={Zap} defaultOpen>
                    <FormSection>
                        <FormRow label="Entry Animation" description="When chat window opens">
                            <Select
                                value={config.widgetAnimationEntry || 'slide-up'}
                                onValueChange={(value) => handleChange('widgetAnimationEntry', value)}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Select animation" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="slide-up">Slide Up</SelectItem>
                                    <SelectItem value="slide-side">Slide Side</SelectItem>
                                    <SelectItem value="scale">Scale (Pop)</SelectItem>
                                    <SelectItem value="fade">Fade</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormRow>
                        <FormRow label="Exit Animation" description="When chat window closes">
                            <Select
                                value={config.widgetAnimationExit || 'slide-down'}
                                onValueChange={(value) => handleChange('widgetAnimationExit', value)}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Select animation" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="slide-down">Slide Down</SelectItem>
                                    <SelectItem value="slide-side">Slide Side</SelectItem>
                                    <SelectItem value="scale">Scale (Pop)</SelectItem>
                                    <SelectItem value="fade">Fade</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormRow>
                        <FormRow label="Physics Style" description="Animation curve type">
                            <Select
                                value={config.widgetAnimationType || 'spring'}
                                onValueChange={(value) => handleChange('widgetAnimationType', value)}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Select physics" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="spring">Spring (Bouncy)</SelectItem>
                                    <SelectItem value="tween">Tween (Linear)</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormRow>
                        <FormRow label={`Duration (${config.widgetAnimationDuration || 0.3}s)`} description="Speed of the transition">
                            <div className="pt-2 px-1">
                                <Slider
                                    min={0.1}
                                    max={1.0}
                                    step={0.1}
                                    value={[config.widgetAnimationDuration || 0.3]}
                                    onValueChange={(value) => handleChange('widgetAnimationDuration', value[0])}
                                    className="py-2"
                                />
                            </div>
                        </FormRow>
                    </FormSection>
                </AccordionSectionGroup>
            </AccordionSectionWrapper>
        </div>
    )
}
